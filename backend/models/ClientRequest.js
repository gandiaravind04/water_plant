import mongoose from "mongoose";

const clientRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  scope: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24,
  },
});

const ClientRequest = mongoose.model("ClientRequest", clientRequestSchema);

export default ClientRequest;
