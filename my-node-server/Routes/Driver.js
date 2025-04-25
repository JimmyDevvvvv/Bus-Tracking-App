import express from 'express';
import { driverAction , getDriver, getMyBusInfo, getMyAssignedStudents, } from '../controllers/Driver.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/action', verifyToken, authorizeRoles('driver'), driverAction);
router.get('/my-bus-info', verifyToken, authorizeRoles('driver'), getMyBusInfo);
router.get('/my-assigned-students', verifyToken, authorizeRoles('driver'), getMyAssignedStudents);
router.get('/driver', verifyToken, authorizeRoles('driver'), getDriver);

export default router;
