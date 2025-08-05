import Bus from '../models/Bus.js';

// Get all buses with pagination and filtering
export const getBuses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const buses = await Bus.find(query)
      .populate('driver_id', 'name email phone')
      .populate('studentsAssigned', 'name email studentId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Bus.countDocuments(query);

    res.json({
      success: true,
      buses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalBuses: total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get bus by ID
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('driver_id', 'name email phone licenseNumber')
      .populate('studentsAssigned', 'name email studentId grade pickupLocation');

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create new bus
export const createBus = async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();

    res.status(201).json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update bus
export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete bus
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Assign driver to bus
export const assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    const busId = req.params.id;

    const bus = await Bus.findByIdAndUpdate(
      busId,
      { driver_id: driverId },
      { new: true }
    ).populate('driver_id', 'name email phone');

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Assign students to bus
export const assignStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const busId = req.params.id;

    const bus = await Bus.findByIdAndUpdate(
      busId,
      { studentsAssigned: studentIds },
      { new: true }
    ).populate('studentsAssigned', 'name email studentId');

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get bus route
export const getBusRoute = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).select('route');
    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }
    res.json({ success: true, route: bus.route });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update bus route
export const updateBusRoute = async (req, res) => {
  try {
    const { route } = req.body;
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { route },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get buses by status
export const getBusesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const buses = await Bus.find({ status })
      .populate('driver_id', 'name email')
      .populate('studentsAssigned', 'name email');

    res.json({ success: true, buses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get bus statistics
export const getBusStats = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });
    const assignedBuses = await Bus.countDocuments({ driver_id: { $exists: true, $ne: null } });

    res.json({
      success: true,
      stats: {
        total: totalBuses,
        active: activeBuses,
        maintenance: maintenanceBuses,
        assigned: assignedBuses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 