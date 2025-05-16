// Routes/Student.js
import express from 'express'
import {
  studentAction,
  getStudentProfile,
  updateStudentProfile,
  getStudentTrips,
  getMyRoute,
} from '../controllers/Student.js'
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js'

const router = express.Router()

// Test endpoint
router.get(
  '/action',
  verifyToken,
  authorizeRoles('student'),
  studentAction
)
router.get("/route", verifyToken, authorizeRoles("student"), getMyRoute);

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
