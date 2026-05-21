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

villageSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

const Village = mongoose.model('Village', villageSchema);

export default Village;
