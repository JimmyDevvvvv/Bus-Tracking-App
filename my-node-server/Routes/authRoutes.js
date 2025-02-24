import express from 'express';
import { registerUser, loginUser, enableMFA } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/enable-mfa', verifyToken, enableMFA);

export default router;
