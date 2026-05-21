import mongoose from "mongoose";

const subTransactionSchema = new mongoose.Schema({
  requestId: {
    type: String,
    trim: true,
  },
  actionType: {
    type: String,
    enum: ["issue", "refill", "extra", "return"],
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
  additionalDue: {
    type: Number,
    default: 0,
  },
  resultingDue: {
    type: Number,
    default: 0,
  },
  refillMode: {
    type: String,
    enum: ["exchange", "net"],
    default: "exchange",
  },
  emptiesReturned: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const transactionSchema = new mongoose.Schema({
  clientRequestId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
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
    ref: "Village",
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
    enum: ["pending", "returned", "overdue", "partially_returned"],
    default: "pending",
  },
  subTransactions: [subTransactionSchema],
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
