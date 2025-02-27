import Location from "../models/location.js";

// ➤ Create a new location (Only Admin)
export const createLocation = async (req, res) => {
    try {
        const { name, latitude, longitude, bus_id, eta } = req.body;

        const newLocation = new Location({
            name,
            latitude,
            longitude,
            bus_id,
            eta
        });

        await newLocation.save();
        return res.status(201).json({ message: "Location created successfully", location: newLocation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Get all locations (Only Admin)
export const getAllLocations = async (req, res) => {
    try {
        const locations = await Location.find();
        return res.status(200).json(locations);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Get a single location by ID (Only Admin)
export const getLocationById = async (req, res) => {
    try {
        const { id } = req.params;
        const location = await Location.findById(id);

        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        return res.status(200).json(location);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Update a location (Only Admin)
export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const location = await Location.findByIdAndUpdate(id, updatedData, { new: true });

        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        return res.status(200).json({ message: "Location updated successfully", location });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Delete a location (Only Admin)
export const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

        const location = await Location.findByIdAndDelete(id);

        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        return res.status(200).json({ message: "Location deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
