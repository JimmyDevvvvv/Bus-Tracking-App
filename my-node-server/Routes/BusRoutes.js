import express from 'express';
import {
  createBus,
  deleteBus,
  getAllBuses,
  getBusById,
  updateBus,
} from '../controllers/BusController.js';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new bus
router.post('/',verifyToken,authorizeRoles('admin'), createBus);

// Get all buses
router.get('/', getAllBuses);

// Get a bus by ID
router.get('/:id', getBusById);

// Update a bus by ID
router.put('/:id', updateBus);

// Delete a bus by ID
router.delete('/:id',verifyToken,authorizeRoles('admin'), deleteBus);

export default router;
