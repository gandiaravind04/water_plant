import Transaction from "../models/Transaction.js";
import Village from "../models/Village.js";
import ClientRequest from "../models/ClientRequest.js";

const acquireClientRequest = async (requestId, scope) => {
  if (!requestId) return false;

  try {
    await ClientRequest.create({ requestId, scope });
    return false;
  } catch (error) {
    if (error.code === 11000) {
      return true;
    }

    throw error;
  }
};

const releaseClientRequest = async (requestId) => {
  if (!requestId) return;
  await ClientRequest.deleteOne({ requestId });
};

const syncOverdueStatuses = async (transactions) =>
  Promise.all(
    transactions.map(async (tx) => {
      if (
        tx.status !== "returned" &&
        tx.cansReturned < tx.cansIssued &&
        new Date() > new Date(tx.dueAt)
      ) {
        if (tx.status !== "overdue") {
          tx.status = "overdue";
          await tx.save();
        }
      }
      return tx;
    }),
  );

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get all transactions
// @route   GET /api/cans
// @access  Private (Owner only)
export const getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const totalCount = await Transaction.countDocuments();
    const transactions = await Transaction.find({})
      .populate("village", "name")
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit);

    const updatedTransactions = await syncOverdueStatuses(transactions);

    res.json({
      transactions: updatedTransactions,
      hasMore: skip + updatedTransactions.length < totalCount,
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate("village", "name")
      .sort({ issuedAt: -1 });

    const updatedTransactions = await syncOverdueStatuses(transactions);

    res.json({
      transactions: updatedTransactions,
      totalCount: updatedTransactions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const lookupVillager = async (req, res) => {
  const villagerName = req.query.villagerName?.trim();
  const phone = req.query.phone?.trim();

  try {
    const orConditions = [];

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone) {
        orConditions.push({
          phone: { $regex: `${escapeRegex(normalizedPhone)}$` },
        });
      }
    }

    if (villagerName) {
      orConditions.push({
        villagerName: {
          $regex: `^${escapeRegex(villagerName)}$`,
          $options: "i",
        },
      });
    }

    if (orConditions.length === 0) {
      return res.json({ matches: [] });
    }

    const matches = await Transaction.find({ $or: orConditions })
      .populate("village", "name")
      .sort({ issuedAt: -1 })
      .limit(10);

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log a new can distribution
// @route   POST /api/cans
// @access  Private (Owner only)
export const createTransaction = async (req, res) => {
  const {
    villagerName,
    phone,
    villageId,
    cansIssued,
    amountPaid,
    amountDue,
    clientRequestId,
  } = req.body;

  try {
    if (!villagerName || !phone || !villageId || cansIssued === undefined) {
      return res.status(400).json({
        message:
          "Please provide villagerName, phone, villageId, and cansIssued",
      });
    }

    // Verify village exists
    const village = await Village.findById(villageId);
    if (!village) {
      return res
        .status(404)
        .json({ message: "Selected village does not exist" });
    }

    const duplicateRequest = await acquireClientRequest(
      clientRequestId,
      "create-transaction",
    );
    if (duplicateRequest) {
      const existingTransaction = await Transaction.findOne({
        clientRequestId,
      }).populate("village", "name");
      if (existingTransaction) {
        return res.status(200).json(existingTransaction);
      }
    }

    const issuedAt = new Date();
    // Due at exactly 24 hours from issued time
    const dueAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

    const transaction = await Transaction.create({
      clientRequestId,
      villagerName,
      phone,
      village: villageId,
      cansIssued,
      amountPaid: amountPaid || 0,
      amountDue: amountDue || 0,
      issuedAt,
      dueAt,
      status: "pending",
      subTransactions: [
        {
          requestId: clientRequestId,
          actionType: "issue",
          cansCount: Number(cansIssued),
          additionalPayment: Number(amountPaid) || 0,
          additionalDue: Number(amountDue) || 0,
          resultingDue: Number(amountDue) || 0,
          timestamp: issuedAt,
        },
      ],
    });

    const populatedTransaction = await Transaction.findById(
      transaction._id,
    ).populate("village", "name");
    res.status(201).json(populatedTransaction);
  } catch (error) {
    if (error.code === 11000 && clientRequestId) {
      const existingTransaction = await Transaction.findOne({
        clientRequestId,
      }).populate("village", "name");
      if (existingTransaction) {
        return res.status(200).json(existingTransaction);
      }
    }

    if (clientRequestId) {
      await releaseClientRequest(clientRequestId);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process can returns
// @route   POST /api/cans/:id/return
// @access  Private (Owner only)
export const returnCans = async (req, res) => {
  const { id } = req.params;
  const { cansReturnedCount, payment, due, requestId } = req.body; // number of cans returned in this turn, optional payment/due adjustments

  try {
    if (cansReturnedCount === undefined || cansReturnedCount < 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid count of cans returned" });
    }

    const duplicateRequest = await acquireClientRequest(
      requestId,
      `return-${id}`,
    );

    const transaction = await Transaction.findById(id).populate(
      "village",
      "name",
    );
    if (!transaction) {
      if (requestId) {
        await releaseClientRequest(requestId);
      }
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (duplicateRequest) {
      return res.json(transaction);
    }

    const newReturnedTotal =
      transaction.cansReturned + Number(cansReturnedCount);
    if (newReturnedTotal > transaction.cansIssued) {
      return res.status(400).json({
        message: `Error: Total returned cans (${newReturnedTotal}) cannot exceed issued cans (${transaction.cansIssued}).`,
      });
    }

    transaction.cansReturned = newReturnedTotal;

    // Log return as sub-transaction
    const pay = Number(payment) || 0;
    const submittedDue = Number(due);
    transaction.amountPaid = (transaction.amountPaid || 0) + pay;
    transaction.amountDue = Number.isNaN(submittedDue)
      ? Math.max(0, (transaction.amountDue || 0) - pay)
      : Math.max(0, submittedDue);

    transaction.subTransactions.push({
      requestId,
      actionType: "return",
      cansCount: Number(cansReturnedCount),
      additionalPayment: pay,
      additionalDue: Number.isNaN(submittedDue) ? 0 : submittedDue,
      resultingDue: transaction.amountDue,
      timestamp: new Date(),
    });

    // Check status
    if (transaction.cansReturned >= transaction.cansIssued) {
      transaction.status = "returned";
    } else if (transaction.cansReturned > 0) {
      transaction.status = "partially_returned";
    } else {
      // Check if overdue
      if (new Date() > new Date(transaction.dueAt)) {
        transaction.status = "overdue";
      } else {
        transaction.status = "pending";
      }
    }

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    if (requestId) {
      await releaseClientRequest(requestId);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refill cans (Records old return, issues refilled cans, resets 24h deadline, updates cost)
// @route   POST /api/cans/:id/refill
// @access  Private (Owner only)
export const refillCans = async (req, res) => {
  const { id } = req.params;
  const {
    requestId,
    refillMode = "exchange",
    cansRefilled,
    emptiesReturned,
    additionalPayment,
    additionalDue,
  } = req.body;

  try {
    if (cansRefilled === undefined || cansRefilled <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide valid number of cans to refill" });
    }

    const duplicateRequest = await acquireClientRequest(
      requestId,
      `refill-${id}`,
    );

    const transaction = await Transaction.findById(id).populate(
      "village",
      "name",
    );
    if (!transaction) {
      if (requestId) {
        await releaseClientRequest(requestId);
      }
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (duplicateRequest) {
      return res.json(transaction);
    }

    const refillCount = Number(cansRefilled);
    const emptiesCount = Number(emptiesReturned) || 0;
    if (refillMode === "net" && emptiesCount < 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid number of empties returned" });
    }

    const returnedCount =
      refillMode === "exchange" ? refillCount : Math.max(0, emptiesCount);

    // Process Refill logic:
    // 1. Audit log the refill event
    transaction.subTransactions.push({
      requestId,
      actionType: "refill",
      cansCount: refillCount,
      emptiesReturned: returnedCount,
      refillMode,
      additionalPayment: Number(additionalPayment) || 0,
      additionalDue: Number(additionalDue) || 0,
      resultingDue: transaction.amountDue + Number(additionalDue) || 0,
      timestamp: new Date(),
    });

    // 2. Update can counts based on the selected refill case.
    transaction.cansIssued += refillCount;
    transaction.cansReturned += returnedCount;

    // 3. Update the financial ledgers
    transaction.amountPaid += Number(additionalPayment) || 0;
    transaction.amountDue += Number(additionalDue) || 0;

    // 4. RESET THE 24-HOUR TIMER starting from right now
    const now = new Date();
    transaction.issuedAt = now;
    transaction.dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    transaction.status = "pending"; // Re-armed return timer

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    if (requestId) {
      await releaseClientRequest(requestId);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Issue extra cans (Keeps existing pending balance, adds more cans, resets 24h deadline, updates cost)
// @route   POST /api/cans/:id/extra
// @access  Private (Owner only)
export const addExtraCans = async (req, res) => {
  const { id } = req.params;
  const { extraCans, additionalPayment, additionalDue, requestId } = req.body;

  try {
    if (extraCans === undefined || extraCans <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide valid number of extra cans" });
    }

    const duplicateRequest = await acquireClientRequest(
      requestId,
      `extra-${id}`,
    );

    const transaction = await Transaction.findById(id).populate(
      "village",
      "name",
    );
    if (!transaction) {
      if (requestId) {
        await releaseClientRequest(requestId);
      }
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (duplicateRequest) {
      return res.json(transaction);
    }

    // Process Extra Cans logic:
    // 1. Audit log the extra distribution event
    transaction.subTransactions.push({
      requestId,
      actionType: "extra",
      cansCount: Number(extraCans),
      additionalPayment: Number(additionalPayment) || 0,
      additionalDue: Number(additionalDue) || 0,
      resultingDue: transaction.amountDue + Number(additionalDue) || 0,
      timestamp: new Date(),
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
    transaction.status = "pending"; // Reset status to active pending

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    if (requestId) {
      await releaseClientRequest(requestId);
    }
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
      return res.status(404).json({ message: "Transaction not found" });
    }
    await Transaction.findByIdAndDelete(id);
    res.json({ message: "Record deleted successfully", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
