import express from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute } from "../controllers/RouteController.js";

const router = express.Router();

// ➤ Only admins can access these routes
router.post("/create", verifyToken,authorizeRoles('admin'), createRoute);
router.get("/all", verifyToken,authorizeRoles('admin'), getAllRoutes);
router.get("/:id", verifyToken,authorizeRoles('admin'), getRouteById);
router.put("/update/:id", verifyToken,authorizeRoles('admin'), updateRoute);
router.delete("/delete/:id", verifyToken,authorizeRoles('admin'), deleteRoute);

export default router;
