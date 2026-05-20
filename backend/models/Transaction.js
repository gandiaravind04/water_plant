import mongoose from 'mongoose';

const subTransactionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: ['refill', 'extra'],
    required: true,
  },
  cansCount: {
    type: Number,
    required: true,
  },
  additionalPayment: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const transactionSchema = new mongoose.Schema({
  villagerName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  village: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: true,
  },
  cansIssued: {
    type: Number,
    required: true,
    min: 0,
  },
  cansReturned: {
    type: Number,
    default: 0,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  amountDue: {
    type: Number,
    default: 0,
    min: 0,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  dueAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'returned', 'overdue', 'partially_returned'],
    default: 'pending',
  },
  subTransactions: [subTransactionSchema],
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
