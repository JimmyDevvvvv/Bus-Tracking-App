// controllers/Driver.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Bus from "../models/Bus.js";
import Notification from "../models/Notification.js";

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
    const driverId = req.user.id;

    const bus = await Bus.findOne({ driver_id: driverId }).populate({
      path: "studentsAssigned",
      select: "name email pickupLocation pickupTime pickupStatus profilePicture", // FIXED
    });

    if (!bus) {
      return res.status(404).json({ success: false, message: "No assigned bus found." });
    }

    const students = bus.studentsAssigned.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      pickupTime: student.pickupTime || "N/A",
      pickupLocation: student.pickupLocation?.address || "Not Set",
      status: student.pickupStatus || "on time",
      profilePicture: student.profilePicture
        ? student.profilePicture.startsWith("http")
          ? student.profilePicture
          : `http://localhost:5002${student.profilePicture}`
        : null,
    }));

    res.json({ success: true, students });
  } catch (err) {
    console.error("getMyAssignedStudents error:", err);
    res.status(500).json({ success: false, message: "Server error" });
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
export const updateStudentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["on time", "late", "absent"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  try {
    const bus = await Bus.findOne({ driver_id: req.user.id });
    if (!bus || !bus.studentsAssigned.includes(id)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const student = await User.findById(id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    student.pickupStatus = status;
    await student.save();

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("updateStudentStatus error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Body: { type: "crash" | "traffic" | "delay" }

export const raiseDriverAlert = async (req, res) => {
  const { type } = req.body;
  const allowed = ["crash", "traffic", "delay"];
  if (!allowed.includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid alert type" });
  }

  try {
    const bus = await Bus.findOne({ driver_id: req.user.id });
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    const io = req.app.get("io");
    if (io) {
      io.to(bus.bus_id).emit("bus:alert", { type, time: new Date() });
    }

    res.json({ success: true, message: "Alert sent" });
  } catch (err) {
    console.error("raiseDriverAlert error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




export const getTripStats = async (req, res) => {
  try {
    const bus = await Bus.findOne({ driver_id: req.user.id }).populate("studentsAssigned");

    if (!bus) {
      return res.status(404).json({ success: false, message: "No bus found for this driver." });
    }

    const students = bus.studentsAssigned;
    const total = students.length;

    const statusCounts = {
      "on time": 0,
      "late": 0,
      "absent": 0,
    };

    students.forEach((s) => {
      const status = s.pickupStatus || "absent";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalStudents: total,
        pickedOnTime: statusCounts["on time"],
        late: statusCounts["late"],
        absent: statusCounts["absent"],
        tripDuration: "00:45", // You can later calculate dynamically
      },
    });
  } catch (err) {
    console.error("getTripStats error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const getStudentDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const bus = await Bus.findOne({ driver_id: req.user.id });
    if (!bus || !bus.studentsAssigned.includes(id)) {
      return res.status(403).json({ success: false, message: "Unauthorized access to student." });
    }

    const student = await User.findById(id).select("-password");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone || "N/A",
        guardianContact: student.guardianContact || "N/A",
        pickupStatus: student.pickupStatus || "absent",
        pickupHistory: student.pickupHistory || [],
        pickupLocation: student.pickupLocation || {},
      },
    });
  } catch (err) {
    console.error("getStudentDetails error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendDriverNotification = async (req, res) => {
  try {
    const { category, message = "" } = req.body;

    const allowedCategories = ["ALL_CLEAR", "TRAFFIC", "ACCIDENT", "DELAYED"];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, error: "Invalid emergency category" });
    }

    // 1. Find the driver's assigned bus
    const bus = await Bus.findOne({ driver_id: req.user.id });
    if (!bus || !bus.studentsAssigned || bus.studentsAssigned.length === 0) {
      return res.status(404).json({ success: false, error: "No assigned students or bus found." });
    }

    const recipients = bus.studentsAssigned;

    // 2. Generate notification
    const titleMap = {
      ALL_CLEAR: "✅ All Clear reported by your bus",
      TRAFFIC: "🚦 Traffic reported on your bus route",
      ACCIDENT: "🚨 Accident reported by your bus",
      DELAYED: "⏱️ Delay reported by your bus"
    };

    const notification = await Notification.create({
      senderId: req.user.id,
      recipientIds: recipients,
      busId: bus._id,
      type: "EMERGENCY",
      category,
      title: titleMap[category],
      message,
      isUrgent: true,
    });

    // 3. Emit to each student
    const io = req.app.get("io");
    if (io) {
      recipients.forEach((studentId) => {
        io.to(`user:${studentId}`).emit("notification:new", {
          id: notification._id,
          title: titleMap[category],
          message,
          type: "EMERGENCY",
          category,
          isUrgent: true,
          createdAt: notification.createdAt,
        });
      });
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error("sendDriverNotification error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};