import express from 'express';
import {
  getTransactions,
  createTransaction,
  returnCans,
  refillCans,
  addExtraCans,
  deleteTransaction,
} from '../controllers/canController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all distribution endpoints
router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.post('/:id/return', returnCans);
router.post('/:id/refill', refillCans);
router.post('/:id/extra', addExtraCans);
router.delete('/:id', deleteTransaction);

export default router;
