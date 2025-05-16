// routes/busRoutes.js
import express from 'express';
import { assignBus, getRoute , assignStudentsToBus} from '../controllers/busController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only admins assign buses
router.post('/assign', verifyToken, authorizeRoles('admin'), assignBus);

// Students/drivers fetch their route
router.get('/:busId/route', verifyToken, getRoute);

router.post(
  '/assign',
  verifyToken,
  authorizeRoles('admin'),
  assignStudentsToBus
)

export default router;
