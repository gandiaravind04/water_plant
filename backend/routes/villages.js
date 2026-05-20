import express from 'express';
import {
  getVillages,
  addVillage,
  deleteVillage,
} from '../controllers/villageController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authorization middleware to all village routes
router.use(protect);

router.route('/')
  .get(getVillages)
  .post(addVillage);

router.route('/:id')
  .delete(deleteVillage);

export default router;
