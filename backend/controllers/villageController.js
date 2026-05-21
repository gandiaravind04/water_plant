import Village from '../models/Village.js';
import Transaction from '../models/Transaction.js';

// @desc    Get all villages
// @route   GET /api/villages
// @access  Private (Owner only)
export const getVillages = async (req, res) => {
  try {
    const villages = await Village.find({}).sort({ name: 1 });
    res.json(villages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new village
// @route   POST /api/villages
// @access  Private (Owner only)
export const addVillage = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Village name is required' });
    }

    const trimmedName = name.trim();

    // Check if village already exists
    const existing = await Village.findOne({ name: trimmedName }).collation({
      locale: "en",
      strength: 2,
    });
    if (existing) {
      return res.status(400).json({ message: 'Village already exists' });
    }

    const village = await Village.create({ name: trimmedName });
    res.status(201).json(village);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Village already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a village
// @route   DELETE /api/villages/:id
// @access  Private (Owner only)
export const deleteVillage = async (req, res) => {
  const { id } = req.params;

  try {
    const village = await Village.findById(id);
    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }

    // Delete all transactions associated with this village to prevent orphan references
    await Transaction.deleteMany({ village: id });

    // Delete the village itself
    await Village.findByIdAndDelete(id);

    res.json({ message: 'Village and all its associated transactions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
