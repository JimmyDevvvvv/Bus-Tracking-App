import Route from "../models/Route.js";
import Location from "../models/location.js";

// ➤ Create a new route (Admin Only)
export const createRoute = async (req, res) => {
    try {
        const { name, bus_id, driver_id, locations, first_location, next_location, final_location, estimated_duration, distance } = req.body;

        // Ensure all locations exist
        const locationDocs = await Location.find({ _id: { $in: locations } });
        if (locationDocs.length !== locations.length) {
            return res.status(400).json({ message: "One or more locations not found" });
        }

        const newRoute = new Route({
            name,
            bus_id,
            driver_id,
            locations,
            first_location,
            current_location:null, // Set first location as the current location
            next_location,
            final_location,
            estimated_duration,
            distance
        });

        await newRoute.save();
        return res.status(201).json({ message: "Route created successfully", route: newRoute });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Get all routes (Admin Only)
export const getAllRoutes = async (req, res) => {
    try {
        const routes = await Route.find().populate("locations first_location current_location next_location final_location");
        return res.status(200).json(routes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Get a single route by ID (Admin Only)
export const getRouteById = async (req, res) => {
    try {
        const { id } = req.params;
        const route = await Route.findById(id).populate("locations first_location current_location next_location final_location");

        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }

        return res.status(200).json(route);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Update a route (Admin Only)
export const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const route = await Route.findByIdAndUpdate(id, updatedData, { new: true });

        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }

        return res.status(200).json({ message: "Route updated successfully", route });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ➤ Delete a route (Admin Only)
export const deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;

        const route = await Route.findByIdAndDelete(id);

        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }

        return res.status(200).json({ message: "Route deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
