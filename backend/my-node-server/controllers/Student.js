import Bus from '../models/Bus.js';
import User from '../models/User.js';

export const studentAction = (req, res) => {
    res.json({ message: `Hello, Student ${req.user.id}! You have access.` });
};

export const getAssignedBus = async (req, res) => {
    try {
        const studentId = req.user.id;
        const assignedBus = await Bus.findOne({ student_id: studentId }).populate('driver_id', 'name email');

        if (!assignedBus) {
            return res.status(404).json({ error: 'No assigned bus found for this student.' });
        }

        res.status(200).json({
            busId: assignedBus.bus_id,
            driver: assignedBus.driver_id,
            status: assignedBus.status,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const reportIssue = async (req, res) => {
    try {
        const { issue } = req.body;

        if (!issue) {
            return res.status(400).json({ error: 'Issue description is required.' });
        }

        console.log(`Student ${req.user.id} reported an issue: ${issue}`);

        res.status(201).json({ message: 'Issue reported successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
