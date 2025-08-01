// Routes/Student.js
import express from 'express'
import {
  studentAction,
  getStudentProfile,
  updateStudentProfile,
  getStudentTrips,
  getMyRoute,
 getUnreadNotifications,
  getReadNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '../controllers/Student.js'
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js'

const router = express.Router()

// Test endpoint
router.get('/action',verifyToken, authorizeRoles('student'), studentAction)
router.get("/route", verifyToken, authorizeRoles("student"), getMyRoute);





//notfi
router.get("/notifications/unread", verifyToken, authorizeRoles('student'), getUnreadNotifications);
router.get("/notifications/read", verifyToken, authorizeRoles('student'), getReadNotifications);
router.patch("/notifications/:id/read", verifyToken, authorizeRoles('student'), markNotificationAsRead);
//router.patch("/notifications/:id/unread", verifyToken, authorizeRoles('student'), markNotificationAsUnread);
router.delete("/notifications/:id", verifyToken,  authorizeRoles('student'), deleteNotification);





// Profile endpoints
router.get(
  '/profile',
  verifyToken,
  authorizeRoles('student'),
  getStudentProfile
)

router.patch(
  '/profile',
  verifyToken,
  authorizeRoles('student'),
  updateStudentProfile
)

// Trip history
router.get(
  '/trips',
  verifyToken,
  authorizeRoles('student'),
  getStudentTrips
)

export default router
