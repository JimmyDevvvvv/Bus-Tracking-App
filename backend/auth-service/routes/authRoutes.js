import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  registerUser,
  loginUser,
  enableMFA,
  disableMFA,
  logoutUser,
  getCurrentUser,
  changePassword
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.use(verifyToken);
router.post('/logout', logoutUser);
router.get('/me', getCurrentUser);
router.post('/mfa/enable', enableMFA);
router.post('/mfa/disable', disableMFA);
router.post('/change-password', changePassword);

export default router; 