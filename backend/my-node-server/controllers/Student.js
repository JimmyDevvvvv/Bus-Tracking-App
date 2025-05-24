// controllers/StudentController.js
import User from '../models/User.js'
import Bus from '../models/Bus.js'
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
    const updates = {}
    const { name, email, pickupLocation, dropoffLocation } = req.body

    if (name) updates.name = name
    if (email) updates.email = email
    if (pickupLocation)  updates.pickupLocation  = JSON.parse(pickupLocation)
    if (dropoffLocation) updates.dropoffLocation = JSON.parse(dropoffLocation)

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password -otp -otpExpires -sessionLogs')
      .lean()

    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({ success: true, user })
  } catch (err) {
    console.error('updateStudentProfile error:', err)
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ success: false, error: 'Email already in use' })
    }
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

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
