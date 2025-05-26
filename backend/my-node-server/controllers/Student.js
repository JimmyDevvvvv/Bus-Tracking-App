// controllers/StudentController.js
import User from '../models/User.js'
import Bus from '../models/Bus.js'
import Notification from "../models/Notification.js";

/**
 * A simple test action
 */
export const studentAction = (req, res) => {
  res.json({
    success: true,
    message: `Hello, Student ${req.user.id}! You have access.`,
  })
}

/**
 * GET /api/student/profile
 * Returns the current student's profile (minus sensitive fields).
 */
export const getStudentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpires -sessionLogs') // strip out sensitive stuff
      .lean()

    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({ success: true, user })
  } catch (err) {
    console.error('getStudentProfile error:', err)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

export const getMyRoute = async (req, res) => {
  try {
    const bus = await Bus.findOne({ studentsAssigned: req.user.id }).select("route");
    if (!bus) {
      return res.status(404).json({ success: false, error: "Bus route not found for you" });
    }
    res.json({ success: true, route: bus.route });
  } catch (err) {
    console.error("getMyRoute error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * PATCH /api/student/profile
 * Allows the student to update name, email, pickup/dropoff locations, etc.
 */
export const updateStudentProfile = async (req, res) => {
  try {
    const updates = {};
    const {
      name,
      email,
      pickupLocation,
      dropoffLocation,
      pickupTime // 🟡 newly added field
    } = req.body;

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (pickupLocation) updates.pickupLocation = JSON.parse(pickupLocation);
    if (dropoffLocation) updates.dropoffLocation = JSON.parse(dropoffLocation);
    if (pickupTime) updates.pickupTime = pickupTime; // 🟡 update it here

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password -otp -otpExpires -sessionLogs')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('updateStudentProfile error:', err);
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
/**
 * GET /api/student/trips
 * Returns the sessionLogs array from the student document, as a "trip history"
 */
export const getStudentTrips = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('sessionLogs')
      .lean()

    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({ success: true, trips: user.sessionLogs || [] })
  } catch (err) {
    console.error('getStudentTrips error:', err)
    res.status(500).json({ success: false, error: 'Server error' })
  }



  
}


export const getUnreadNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const notifications = await Notification.find({
      recipientIds: studentId,
      readBy: { $ne: studentId },
      deletedBy: { $ne: studentId }
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "role name");

    const result = notifications.map((notif) => ({
      id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      category: notif.category,
      isUrgent: notif.isUrgent,
      time: notif.createdAt,
      read: false,
      from: notif.senderId?.role === "admin" ? "System" : notif.senderId?.name || "Unknown"
    }));

    res.json({ success: true, notifications: result });
  } catch (err) {
    console.error("getUnreadNotifications error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};




export const getReadNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const notifications = await Notification.find({
      recipientIds: studentId,
      readBy: studentId,
      deletedBy: { $ne: studentId }
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "role name");

    const result = notifications.map((notif) => ({
      id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      category: notif.category,
      isUrgent: notif.isUrgent,
      time: notif.createdAt,
      read: true,
      from: notif.senderId?.role === "admin" ? "System" : notif.senderId?.name || "Unknown"
    }));

    res.json({ success: true, notifications: result });
  } catch (err) {
    console.error("getReadNotifications error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};












// PATCH /api/student/notifications/:id/read
export const markNotificationAsRead = async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;

  try {
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: studentId },
    });

    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("markNotificationAsRead error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
// DELETE /api/student/notifications/:id
export const deleteNotification = async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;

  try {
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { deletedBy: studentId },
    });

    res.json({ success: true, message: "Deleted notification" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
