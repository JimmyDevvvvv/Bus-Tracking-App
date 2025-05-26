import express from "express";
import {
  driverAction,
  getDriver,
  getMyBusInfo,
  getMyAssignedStudents,
  updateLocation,
  updateStudentStatus,
  raiseDriverAlert,
  getTripStats,
  getStudentDetails,
} from "../controllers/Driver.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Authenticated driver endpoints
router.get("/action", verifyToken, authorizeRoles("driver"), driverAction);
router.get("/me", verifyToken, authorizeRoles("driver"), getDriver);
router.get("/my-bus-info", verifyToken, authorizeRoles("driver"), getMyBusInfo);
router.get("/students", verifyToken, authorizeRoles("driver"), getMyAssignedStudents);
router.post("/location", verifyToken, authorizeRoles("driver"), updateLocation);

// ✅ NEW APIs:

// 1. Get trip stats for dashboard
router.get("/stats", verifyToken, authorizeRoles("driver"), getTripStats);

// 2. Get full student profile for SlideOver
router.get("/student/:id", verifyToken, authorizeRoles("driver"), getStudentDetails);

export default router;
