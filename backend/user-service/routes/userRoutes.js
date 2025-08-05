import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getStudents,
  getDrivers,
  updateUserLocation,
  updatePickupStatus
} from '../controllers/userController.js';

const router = express.Router();

// General user routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Role-specific routes
router.get('/students', getStudents);
router.get('/drivers', getDrivers);

// Location and status updates
router.put('/users/location', updateUserLocation);
router.put('/users/:id/pickup-status', updatePickupStatus);

export default router; 