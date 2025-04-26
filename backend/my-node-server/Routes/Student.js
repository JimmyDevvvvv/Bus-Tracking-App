import express from 'express';
import { studentAction, getAssignedBus, reportIssue } from '../controllers/Student.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/action', verifyToken, authorizeRoles('student'), studentAction);
router.get('/assigned-bus', verifyToken, authorizeRoles('student'), getAssignedBus);
router.post('/report', verifyToken, authorizeRoles('student'), reportIssue);

export default router;
