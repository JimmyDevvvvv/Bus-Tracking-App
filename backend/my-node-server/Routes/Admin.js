import express from 'express';
import {
  getDashboardMetrics,
  addReportComment,
  adminAction,
  assignDriverToBus,
  assignReport,
  createBus,
  createUser,
  deleteBus,
  deleteUser,
  exportAnalyticsReport,
  getAllBuses,
  getAllReports,
  getAllUsers,
  getAnalyticsBuses,
  getAnalyticsEngagement,
  getAnalyticsOverview,
  getAnalyticsReports,
  getAnalyticsUsage,
  getBusById,
  getReportById,
  getSystemSettings,
  getUserById,
  updateBus,
  updateReport,
  updateSystemSettings,
  updateUser,
} from '../controllers/Admin.js';
import assignStudentsToBus from "../controllers/busController.js"
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Legacy route
router.get('/action', verifyToken, authorizeRoles('admin'), adminAction);

// User Management
router.get('/users', verifyToken, authorizeRoles('admin'), getAllUsers);
router.post('/users', verifyToken, authorizeRoles('admin'), createUser);
router.get('/users/:id', verifyToken, authorizeRoles('admin'), getUserById);
router.put('/users/:id', verifyToken, authorizeRoles('admin'), updateUser);
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), deleteUser);

// Bus Management
router.get('/buses', verifyToken, authorizeRoles('admin'), getAllBuses);
router.post('/bus', verifyToken, authorizeRoles('admin'), createBus);
router.get('/bus/:id', verifyToken, authorizeRoles('admin'), getBusById);
router.put('/bus/:id', verifyToken, authorizeRoles('admin'), updateBus);
router.delete('/bus/:id', verifyToken, authorizeRoles('admin'), deleteBus);
router.post('/bus/assign-driver', verifyToken, authorizeRoles('admin'), assignDriverToBus);

// Report Viewing
router.get('/reports', verifyToken, authorizeRoles('admin'), getAllReports);
router.get('/reports/:id', verifyToken, authorizeRoles('admin'), getReportById);
router.put('/reports/:id', verifyToken, authorizeRoles('admin'), updateReport);
router.post('/reports/:id/comments', verifyToken, authorizeRoles('admin'), addReportComment);
router.post('/reports/:id/assign', verifyToken, authorizeRoles('admin'), assignReport);

// Analytics
router.get('/analytics/overview', verifyToken, authorizeRoles('admin'), getAnalyticsOverview);
router.get('/analytics/usage', verifyToken, authorizeRoles('admin'), getAnalyticsUsage);
router.get('/analytics/buses', verifyToken, authorizeRoles('admin'), getAnalyticsBuses);
router.get('/analytics/reports', verifyToken, authorizeRoles('admin'), getAnalyticsReports);
router.get('/analytics/engagement', verifyToken, authorizeRoles('admin'), getAnalyticsEngagement);
router.get('/analytics/export', verifyToken, authorizeRoles('admin'), exportAnalyticsReport);

// System Settings
router.get('/settings', verifyToken, authorizeRoles('admin'), getSystemSettings);
router.put('/settings', verifyToken, authorizeRoles('admin'), updateSystemSettings);
router.put('/bus/:busId/assign-students', verifyToken, authorizeRoles('admin'), assignStudentsToBus);

router.get('/dashboard-metrics', verifyToken, authorizeRoles('admin'), getDashboardMetrics);

export default router;
