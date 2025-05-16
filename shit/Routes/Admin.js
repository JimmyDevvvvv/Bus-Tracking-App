import express from 'express';
import { adminAction, createBus, getAllBuses, AssignBusToDriver, AssignStudentToBus } from '../controllers/Admin.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/action', verifyToken, authorizeRoles('admin'), adminAction);
router.get('/buses',verifyToken, authorizeRoles('admin'), getAllBuses);
router.post('/create-bus', verifyToken, authorizeRoles('admin'), createBus);
router.put('/assign-bus/:id', verifyToken, authorizeRoles('admin'), AssignBusToDriver);
router.put('/assign-student/:id', verifyToken, authorizeRoles('admin'), AssignStudentToBus);

export default router;
