import User from "../models/User.js";
import Bus from "../models/Bus.js";
import mongoose from 'mongoose';

export const driverAction = (req, res) => {
    res.json({ message: `Hello, Driver ${req.user.id}! You have access.` });
};

// get driver info
// Tested on postman and it works fine.
export const getDriver = async (req, res) => {
    try {
        const driver = await User.findById(req.user.id).select("-password");
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }
        res.json(driver);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyBusInfo = async (req, res) => {
    try {

        const driverObjectId = mongoose.Types.ObjectId.isValid(req.user.id)
        ? new mongoose.Types.ObjectId(req.user.id)
        : req.user.id;

        const bus = await Bus.findOne({ driver_id: driverObjectId })
            .populate('driver_id', 'name email role')
            .populate('studentsAssigned', 'name _id')
            .populate('locations');

        if (!bus) {
            return res.status(404).json({ message: 'No bus assigned to this driver.' });
        }

        res.status(200).json({
            bus_id: bus.bus_id,
            driver: bus.driver_id,
            students: bus.studentsAssigned,
            areaServed: bus.locations,
        });
    } catch (error) {
        console.error('Error fetching driver bus:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};



export const getMyAssignedStudents = async (req, res) => {
    try {
        console.log("Logged-in driver ID:", req.user.id);
        console.log("Type of driver ID:", typeof req.user.id);
        
        const driverObjectId = mongoose.Types.ObjectId.isValid(req.user.id)
        ? new mongoose.Types.ObjectId(req.user.id)
        : req.user.id;

        const bus = await Bus.findOne({ driver_id: driverObjectId })
            .populate('studentsAssigned', 'name _id');

        if (!bus) {
            return res.status(404).json({ message: 'No bus assigned to this driver.' });
        }

        const students = bus.studentsAssigned.map(student => ({
            id: student._id,
            name: student.name
        }));

        res.status(200).json(students);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

