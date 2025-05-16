// routes/busRoutes.js
import express from 'express';
import { assignBus, assignStudentsToBus, getRoute } from '../controllers/busController.js';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only admins assign buses
router.post('bus/assign', verifyToken, authorizeRoles('admin'), assignBus);

// Students/drivers fetch their route
router.get('bus/:busId/route', verifyToken, getRoute);

// Assign students to bus
router.put('admin/bus/:busId/assign-students', verifyToken, authorizeRoles('admin'), assignStudentsToBus);

export default router;
