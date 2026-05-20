import mongoose from 'mongoose';

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Village = mongoose.model('Village', villageSchema);

export default Village;
