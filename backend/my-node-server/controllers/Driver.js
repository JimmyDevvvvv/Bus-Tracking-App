// controllers/Driver.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Bus from "../models/Bus.js";

/**
 * Simple test endpoint
 * GET /api/driver/action
 */
export const driverAction = (req, res) => {
  res.json({ message: `Hello, Driver ${req.user.id}! You have access.` });
};

/**
 * GET /api/driver/me
 * Returns the logged‐in driver’s own user data (minus password)
 */
export const getDriver = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select("-password");
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }
    res.json({ success: true, driver });
  } catch (err) {
    console.error("getDriver error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/driver/my-bus-info
 * Finds the Bus document assigned to this driver, populates some fields,
 * and returns basic info (bus_id, driver, students, served area).
 */
export const getMyBusInfo = async (req, res) => {
  try {
    const driverId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    const bus = await Bus.findOne({ driver_id: driverId })
      .populate("driver_id", "name email role")
      .populate("studentsAssigned", "name _id")
      .populate("currentLocation");

    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: "No bus assigned to this driver." });
    }

    res.json({
      success: true,
      bus_id: bus.bus_id,
      driver: bus.driver_id,
      students: bus.studentsAssigned,
      areaServed: bus.locations,
    });
  } catch (err) {
    console.error("getMyBusInfo error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/driver/students
 * Returns a simple array of { id, name } for all students on the driver’s bus
 */
export const getMyAssignedStudents = async (req, res) => {
  try {
    const driverId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    const bus = await Bus.findOne({ driver_id: driverId }).populate(
      "studentsAssigned",
      "name _id"
    );

    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: "No bus assigned to this driver." });
    }

    const students = bus.studentsAssigned.map((s) => ({
      id: s._id,
      name: s.name,
    }));

    res.json({ success: true, students });
  } catch (err) {
    console.error("getMyAssignedStudents error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/driver/location
 * Body: { latitude: number, longitude: number, address?: string }
 *
 * - Updates `bus.currentLocation` in Mongo
 * - Emits a socket.io event `bus:locationUpdate` to everyone in the room named by this bus’s bus_id
 */
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "latitude and longitude are required" });
    }

    // Find the bus assigned to this driver
    const bus = await Bus.findOne({ driver_id: req.user.id });
    if (!bus) {
      return res
        .status(404)
        .json({ success: false, message: "No bus assigned to this driver." });
    }

    // Update currentLocation
    bus.currentLocation = {
      latitude,
      longitude,
      address: address || bus.currentLocation?.address,
      timestamp: new Date(),
    };
    await bus.save();

    // Emit over Socket.io
    const io = req.app.get("io");
    if (io && bus.bus_id) {
      io.to(bus.bus_id).emit("bus:locationUpdate", {
        busId: bus.bus_id,
        latitude,
        longitude,
        timestamp: bus.currentLocation.timestamp,
      });
    }

    res.json({ success: true, message: "Location updated" });
  } catch (err) {
    console.error("updateLocation error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
