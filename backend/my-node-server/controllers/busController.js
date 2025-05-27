// controllers/busController.js
import mongoose from 'mongoose';
import Bus from '../models/Bus.js';
import User from '../models/User.js';

export const assignBus = async (req, res) => {
  const { busId, driverId, studentIds } = req.body;
  try {
    // 1. Validate
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success:false, error:'Bus not found' });

    // 2. Assign driver & students
    bus.driver_id = driverId;
    bus.studentsAssigned = studentIds;
    // 3. Build route.stops from students' pickupLocation
    const students = await User.find({ _id: { $in: studentIds } });
    bus.route.stops = students.map(s => ({
      studentId: s._id,
      address: s.pickupLocation.address,
      latitude: s.pickupLocation.latitude,
      longitude: s.pickupLocation.longitude
    }));
    await bus.save();

    res.json({ success: true, bus });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success:false, error: 'Server error' });
  }
};


export const getLocation = async (req, res) => {
  const { busId } = req.params;

  // validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(busId)) {
    return res.status(400).json({ success: false, error: 'Invalid busId' });
  }

  const bus = await Bus.findById(busId).select('currentLocation');
  if (!bus) {
    return res.status(404).json({ success: false, error: 'Bus not found' });
  }

  // if not yet set, you can default to { latitude: 0, longitude: 0 }
  if (!bus.currentLocation) {
    return res
      .status(200)
      .json({ success: true, data: { latitude: 0, longitude: 0, timestamp: null } });
  }

  res.json({ success: true, data: bus.currentLocation });
};


export const getRoute = async (req, res) => {
  const { busId } = req.params;
  const bus = await Bus.findById(busId).select('route.stops');
  if (!bus) return res.status(404).json({ success:false, error:'Not found' });
  res.json({ success:true, stops: bus.route.stops });
};

export const assignStudentsToBus = async (req, res) => {
  try {
    const { busId } = req.params;
    const { studentIds } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid bus ID' 
      });
    }

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'studentIds must be an array' 
      });
    }

    // Validate all student IDs
    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    });

    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Some student IDs are invalid or not students' 
      });
    }

    // Update the bus with new student assignments
    const bus = await Bus.findByIdAndUpdate(
      busId,
      { 
        $set: { 
          studentsAssigned: studentIds,
          currentStudentCount: studentIds.length 
        }
      },
      { new: true }
    ).populate('studentsAssigned', 'name email');

    if (!bus) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bus not found' 
      });
    }

    // Update each student's assignedBusId
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { assignedBusId: busId } }
    );

    res.json({ 
      success: true, 
      bus 
    });
  } catch (err) {
    console.error('Error assigning students to bus:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to assign students to bus' 
    });
  }
};


export const updateLocation = async (req, res) => {
  const { busId } = req.params;
  const { latitude, longitude } = req.body;

  if (!mongoose.Types.ObjectId.isValid(busId)) {
    return res.status(400).json({ success: false, error: 'Invalid busId' });
  }
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return res
      .status(400)
      .json({ success: false, error: 'latitude & longitude must be numbers' });
  }

  const bus = await Bus.findByIdAndUpdate(
    busId,
    {
      currentLocation: {
        latitude,
        longitude,
        timestamp: new Date(),
      },
    },
    { new: true }
  ).select('currentLocation');

  if (!bus) {
    return res.status(404).json({ success: false, error: 'Bus not found' });
  }

  res.json({ success: true, data: bus.currentLocation });
};

export default assignStudentsToBus;
