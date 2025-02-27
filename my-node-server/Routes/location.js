import express from "express";
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { createLocation, getAllLocations, getLocationById, updateLocation, deleteLocation } from "../controllers/locationController.js";

const router = express.Router();

// ➤ Only admins can access these routes
router.post("/create", verifyToken,authorizeRoles('admin'), createLocation);
router.get("/all", verifyToken,authorizeRoles('admin'), getAllLocations);
router.get("/:id", verifyToken,authorizeRoles('admin'), getLocationById);
router.put("/update/:id", verifyToken,authorizeRoles('admin'), updateLocation);
router.delete("/delete/:id", verifyToken,authorizeRoles('admin'), deleteLocation);

export default router;
