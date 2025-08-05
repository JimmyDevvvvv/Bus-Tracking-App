import express from 'express';
import {
  getBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  assignDriver,
  assignStudents,
  getBusRoute,
  updateBusRoute,
  getBusesByStatus,
  getBusStats
} from '../controllers/busController.js';

const router = express.Router();

// General bus routes
router.get('/buses', getBuses);
router.get('/buses/stats', getBusStats);
router.get('/buses/:id', getBusById);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Assignment routes
router.put('/buses/:id/assign-driver', assignDriver);
router.put('/buses/:id/assign-students', assignStudents);

// Route management
router.get('/buses/:id/route', getBusRoute);
router.put('/buses/:id/route', updateBusRoute);

// Status-based routes
router.get('/buses/status/:status', getBusesByStatus);

export default router; 