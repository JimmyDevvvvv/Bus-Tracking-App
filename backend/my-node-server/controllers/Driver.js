// controllers/Driver.js

import mongoose from 'mongoose';
import User  from '../models/User.js';
import Bus   from '../models/Bus.js';

export const driverAction = (req, res) => {
  res.json({ message: `Hello, Driver ${req.user.id}! You have access.` });
};

export const getDriver = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select('-password');
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyBusInfo = async (req, res) => {
  try {
    const driverId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    const bus = await Bus.findOne({ driver_id: driverId })
      .populate('driver_id', 'name email role')
      .populate('studentsAssigned', 'name _id')
      .populate('currentLocation');

    if (!bus) {
      return res.status(404).json({ message: 'No bus assigned to this driver.' });
    }

    res.json({
      bus_id:     bus.bus_id,
      driver:     bus.driver_id,
      students:   bus.studentsAssigned,
      areaServed: bus.locations,
    });
  } catch (err) {
    console.error('Error fetching driver bus:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyAssignedStudents = async (req, res) => {
  try {
    const driverId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    const bus = await Bus.findOne({ driver_id: driverId })
      .populate('studentsAssigned', 'name _id');

    if (!bus) {
      return res.status(404).json({ message: 'No bus assigned to this driver.' });
    }

    const students = bus.studentsAssigned.map(s => ({
      id:   s._id,
      name: s.name
    }));

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
