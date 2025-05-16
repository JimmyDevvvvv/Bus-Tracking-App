// controllers/busController.js
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

export const getRoute = async (req, res) => {
  const { busId } = req.params;
  const bus = await Bus.findById(busId).select('route.stops');
  if (!bus) return res.status(404).json({ success:false, error:'Not found' });
  res.json({ success:true, stops: bus.route.stops });
};

export const assignStudentsToBus = async (req, res) => {
  const { busId, studentIds } = req.body

  if (!mongoose.Types.ObjectId.isValid(busId) || !Array.isArray(studentIds)) {
    return res.status(400).json({ success: false, error: 'busId and studentIds required' })
  }

  try {
    // 1) update Bus.studentsAssigned
    const bus = await Bus.findByIdAndUpdate(
      busId,
      { $addToSet: { studentsAssigned: { $each: studentIds } } },
      { new: true }
    )
    if (!bus) return res.status(404).json({ success: false, error: 'Bus not found' })

    // 2) set each User.assignedBusId
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { assignedBusId: busId } }
    )

    res.json({ success: true, bus })
  } catch (err) {
    console.error('assignStudentsToBus error:', err)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}
