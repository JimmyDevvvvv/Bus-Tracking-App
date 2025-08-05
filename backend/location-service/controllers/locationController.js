import Location from '../models/Location.js';
import Bus from '../models/Bus.js';

// Update bus location
export const updateLocation = async (req, res) => {
  try {
    const { busId, latitude, longitude, address, accuracy, speed, heading, batteryLevel, signalStrength } = req.body;
    const driverId = req.headers['x-user-id'];

    // Create new location record
    const locationData = {
      busId,
      driverId,
      location: {
        latitude,
        longitude,
        address,
        accuracy,
        speed,
        heading
      },
      metadata: {
        batteryLevel,
        signalStrength,
        deviceInfo: req.headers['user-agent'] || 'unknown'
      },
      timestamp: new Date()
    };

    const location = new Location(locationData);
    await location.save();

    // Update bus current location
    await Bus.findByIdAndUpdate(busId, {
      currentLocation: {
        latitude,
        longitude,
        timestamp: new Date()
      },
      lastUpdated: new Date()
    });

    // Emit real-time update via Socket.IO
    req.app.get('io').to(`bus-${busId}`).emit('bus-location', {
      busId,
      latitude,
      longitude,
      address,
      timestamp: new Date()
    });

    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get current location of a bus
export const getBusLocation = async (req, res) => {
  try {
    const { busId } = req.params;

    const location = await Location.findOne({ busId })
      .sort({ timestamp: -1 })
      .populate('busId', 'busNumber licensePlate')
      .populate('driverId', 'name phone');

    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get location history for a bus
export const getLocationHistory = async (req, res) => {
  try {
    const { busId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = { busId };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('busId', 'busNumber licensePlate');

    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all active buses with their current locations
export const getActiveBuses = async (req, res) => {
  try {
    const activeLocations = await Location.aggregate([
      {
        $group: {
          _id: '$busId',
          latestLocation: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestLocation' }
      },
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
        }
      },
      {
        $sort: { timestamp: -1 }
      }
    ]);

    // Populate bus and driver information
    const populatedLocations = await Location.populate(activeLocations, [
      { path: 'busId', select: 'busNumber licensePlate model status' },
      { path: 'driverId', select: 'name phone' }
    ]);

    res.json({ success: true, activeBuses: populatedLocations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get driver's current location
export const getDriverLocation = async (req, res) => {
  try {
    const driverId = req.headers['x-user-id'];

    const location = await Location.findOne({ driverId })
      .sort({ timestamp: -1 })
      .populate('busId', 'busNumber licensePlate')
      .populate('driverId', 'name phone');

    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get location statistics
export const getLocationStats = async (req, res) => {
  try {
    const totalBuses = await Location.distinct('busId').count();
    const activeBuses = await Location.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLocations = await Location.countDocuments({
      timestamp: { $gte: today }
    });

    res.json({
      success: true,
      stats: {
        totalBuses,
        activeBuses,
        todayLocations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 