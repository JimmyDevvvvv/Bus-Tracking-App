import express from 'express';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  getBusNotifications,
  getNotificationStats
} from '../controllers/notificationController.js';

const router = express.Router();

// Notification management
router.post('/notifications', createNotification);
router.get('/notifications', getUserNotifications);
router.get('/notifications/stats', getNotificationStats);
router.put('/notifications/:notificationId/read', markAsRead);
router.delete('/notifications/:notificationId', deleteNotification);

// Bus-specific notifications
router.get('/notifications/bus/:busId', getBusNotifications);

export default router; 