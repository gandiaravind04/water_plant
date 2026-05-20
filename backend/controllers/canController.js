import Transaction from '../models/Transaction.js';
import Village from '../models/Village.js';


// @desc    Get all transactions
// @route   GET /api/cans
// @access  Private (Owner only)
export const getTransactions = async (req, res) => {
  try {
    // Populate village details
    const transactions = await Transaction.find({})
      .populate('village', 'name')
      .sort({ issuedAt: -1 });

    // Check and dynamically mark overdue records before sending response
    const updatedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        if (
          tx.status !== 'returned' &&
          tx.cansReturned < tx.cansIssued &&
          new Date() > new Date(tx.dueAt)
        ) {
          if (tx.status !== 'overdue') {
            tx.status = 'overdue';
            await tx.save();
          }
        }
        return tx;
      })
    );

    res.json(updatedTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log a new can distribution
// @route   POST /api/cans
// @access  Private (Owner only)
export const createTransaction = async (req, res) => {
  const { villagerName, phone, villageId, cansIssued, amountPaid, amountDue } = req.body;

  try {
    if (!villagerName || !phone || !villageId || cansIssued === undefined) {
      return res.status(400).json({ message: 'Please provide villagerName, phone, villageId, and cansIssued' });
    }

    // Verify village exists
    const village = await Village.findById(villageId);
    if (!village) {
      return res.status(404).json({ message: 'Selected village does not exist' });
    }

    const issuedAt = new Date();
    // Due at exactly 24 hours from issued time
    const dueAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

    const transaction = await Transaction.create({
      villagerName,
      phone,
      village: villageId,
      cansIssued,
      amountPaid: amountPaid || 0,
      amountDue: amountDue || 0,
      issuedAt,
      dueAt,
      status: 'pending',
    });

    const populatedTransaction = await Transaction.findById(transaction._id).populate('village', 'name');
    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process can returns
// @route   POST /api/cans/:id/return
// @access  Private (Owner only)
export const returnCans = async (req, res) => {
  const { id } = req.params;
  const { cansReturnedCount } = req.body; // number of cans returned in this turn

  try {
    if (cansReturnedCount === undefined || cansReturnedCount < 0) {
      return res.status(400).json({ message: 'Please provide a valid count of cans returned' });
    }

    const transaction = await Transaction.findById(id).populate('village', 'name');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const newReturnedTotal = transaction.cansReturned + Number(cansReturnedCount);
    if (newReturnedTotal > transaction.cansIssued) {
      return res.status(400).json({ 
        message: `Error: Total returned cans (${newReturnedTotal}) cannot exceed issued cans (${transaction.cansIssued}).` 
      });
    }

    transaction.cansReturned = newReturnedTotal;

    // Check status
    if (transaction.cansReturned >= transaction.cansIssued) {
      transaction.status = 'returned';
    } else if (transaction.cansReturned > 0) {
      transaction.status = 'partially_returned';
    } else {
      // Check if overdue
      if (new Date() > new Date(transaction.dueAt)) {
        transaction.status = 'overdue';
      } else {
        transaction.status = 'pending';
      }
    }

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refill cans (Records old return, issues refilled cans, resets 24h deadline, updates cost)
// @route   POST /api/cans/:id/refill
// @access  Private (Owner only)
export const refillCans = async (req, res) => {
  const { id } = req.params;
  const { cansRefilled, additionalPayment, additionalDue } = req.body;

  try {
    if (cansRefilled === undefined || cansRefilled <= 0) {
      return res.status(400).json({ message: 'Please provide valid number of cans to refill' });
    }

    const transaction = await Transaction.findById(id).populate('village', 'name');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Process Refill logic:
    // 1. Audit log the refill event
    transaction.subTransactions.push({
      actionType: 'refill',
      cansCount: Number(cansRefilled),
      additionalPayment: Number(additionalPayment) || 0,
      timestamp: new Date()
    });

    // 2. We assume they returned their current outstanding cans and got new ones.
    // So we reset the owing status:
    // The outstanding cans now become the refilled quantity. 
    // Example: they had 5 cans, returned them (ledger clean), took 5 new ones.
    // They now owe `cansRefilled` cans.
    transaction.cansIssued = Number(cansRefilled);
    transaction.cansReturned = 0; // Fresh cycle for the refilled cans

    // 3. Update the financial ledgers
    transaction.amountPaid += Number(additionalPayment) || 0;
    transaction.amountDue += Number(additionalDue) || 0;

    // 4. RESET THE 24-HOUR TIMER starting from right now
    const now = new Date();
    transaction.issuedAt = now;
    transaction.dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    transaction.status = 'pending'; // Re-armed return timer

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Issue extra cans (Keeps existing pending balance, adds more cans, resets 24h deadline, updates cost)
// @route   POST /api/cans/:id/extra
// @access  Private (Owner only)
export const addExtraCans = async (req, res) => {
  const { id } = req.params;
  const { extraCans, additionalPayment, additionalDue } = req.body;

  try {
    if (extraCans === undefined || extraCans <= 0) {
      return res.status(400).json({ message: 'Please provide valid number of extra cans' });
    }

    const transaction = await Transaction.findById(id).populate('village', 'name');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Process Extra Cans logic:
    // 1. Audit log the extra distribution event
    transaction.subTransactions.push({
      actionType: 'extra',
      cansCount: Number(extraCans),
      additionalPayment: Number(additionalPayment) || 0,
      timestamp: new Date()
    });

    // 2. Increase the total cans issued on this transaction
    transaction.cansIssued += Number(extraCans);

    // 3. Update the financial ledgers
    transaction.amountPaid += Number(additionalPayment) || 0;
    transaction.amountDue += Number(additionalDue) || 0;

    // 4. Extends/resets the 24-hour return timer starting from now since they took new stock
    const now = new Date();
    transaction.issuedAt = now;
    transaction.dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    transaction.status = 'pending'; // Reset status to active pending

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a transaction record
// @route   DELETE /api/cans/:id
// @access  Private (Owner only)
export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    await Transaction.findByIdAndDelete(id);
    res.json({ message: 'Record deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
