import express from 'express';
import {
  registerOwner,
  loginOwner,
  getOwnerProfile,
  updateOwnerProfile,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerOwner);
router.post('/login', loginOwner);
router.get('/profile', protect, getOwnerProfile);
router.put('/profile', protect, updateOwnerProfile);

export default router;
