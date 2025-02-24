import express from 'express';
import { driverAction } from '../controllers/Driver.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/action', verifyToken, authorizeRoles('driver'), driverAction);

export default router;
