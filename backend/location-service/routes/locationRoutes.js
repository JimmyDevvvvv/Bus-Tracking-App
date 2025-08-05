import express from 'express';
import {
  updateLocation,
  getBusLocation,
  getLocationHistory,
  getActiveBuses,
  getDriverLocation,
  getLocationStats
} from '../controllers/locationController.js';

const router = express.Router();

// Location update (for drivers)
router.post('/location/update', updateLocation);

// Get location data
router.get('/location/bus/:busId', getBusLocation);
router.get('/location/bus/:busId/history', getLocationHistory);
router.get('/location/active-buses', getActiveBuses);
router.get('/location/driver', getDriverLocation);

// Statistics
router.get('/location/stats', getLocationStats);

export default router; 