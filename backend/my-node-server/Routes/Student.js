import express from 'express';
import { studentAction } from '../controllers/Student.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/action', verifyToken, authorizeRoles('student'), studentAction);

export default router;
