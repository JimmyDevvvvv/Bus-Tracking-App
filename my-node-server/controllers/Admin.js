import User from '../models/User.js';
import Bus from '../models/Bus.js';
import Location from '../models/Location.js';

export const adminAction = (req, res) => {
    res.json({ message: `Hello, Admin ${req.user.id}! You have access.` });
};

//create busss
// Tested on postman and it works fine.
export const createBus = async (req, res) => {
    const {bus_id} = req.body;

    try {
        const existingBus = await Bus.findOne({ bus_id }); 
        if (existingBus) {
            return res.status(400).json({ message: "Bus already exists" });
        }

        const newBus = new Bus({
            bus_id,
            status: 'Waiting',
            locations: [], 
            studentsAssigned: [] 
        });

        await newBus.save();
        res.status(201).json({ message: "Bus created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// get All Buses
export const getAllBuses = async (req, res) => {
    try {
        const buses = await Bus.find()
            .populate('driver_id', 'name email role')
            .populate('studentsAssigned', 'name _id')
            .populate('locations'); 

        if(!buses || buses.length === 0){
            return res.status(404).json({ message: "No buses found" });
        }

        res.status(200).json(buses);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Assign a bus to a driver
// Tested on postman and it works fine.
export const AssignBusToDriver = async (req, res) => {
    const bus_id = req.params.id; 
    const { driver_id } = req.body; 

    try {
       
    
        const bus = await Bus.findById(bus_id); 
        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }

        const driver = await User.findById(driver_id);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        if (driver.role !== 'driver') {
            return res.status(400).json({ message: "User is not a driver" });
        }


        bus.driver_id = driver_id;
        await bus.save();

        res.status(200).json({ message: "Bus assigned to driver successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Assign a student to an existing bus
// Tested on postman and it works fine.
export const AssignStudentToBus = async (req, res) => {
    const bus_id = req.params.id;  // later on if u don't wanna access the bus from the url we can change it to req.body and change the route when we get to the frontend.
    const { student_id } = req.body;  

    try {
        if (!bus_id || !student_id) {
            return res.status(400).json({ message: "Bus ID and Student ID are required." });
        }
        const bus = await Bus.findById( bus_id );
        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }

        const student = await User.findById(student_id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (student.role !== 'student') {
            return res.status(400).json({ message: "User is not a student" });
        }

        bus.studentsAssigned.push(student_id);
        await bus.save();

        res.status(200).json({ message: "Student assigned to bus successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};


