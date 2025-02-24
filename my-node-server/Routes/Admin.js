import express from 'express';
import { adminAction } from '../controllers/Admin.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/action', verifyToken, authorizeRoles('admin'), adminAction);

export default router;
