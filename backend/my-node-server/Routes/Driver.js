import express from "express";
import {
  driverAction,
  getDriver,
  getMyBusInfo,
  getMyAssignedStudents,
  updateLocation,
} from "../controllers/Driver.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/action", verifyToken, authorizeRoles("driver"), driverAction);
router.get("/me", verifyToken, authorizeRoles("driver"), getDriver);
router.get("/my-bus-info", verifyToken, authorizeRoles("driver"), getMyBusInfo);
router.get(
  "/students",
  verifyToken,
  authorizeRoles("driver"),
  getMyAssignedStudents
);
router.post(
  "/location",
  verifyToken,
  authorizeRoles("driver"),
  updateLocation
);

export default router;
