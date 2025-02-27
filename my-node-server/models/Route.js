import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Route name (e.g., "University Route A")
    bus_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // List of all stops along the route
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],

    // Key locations for tracking progress
    first_location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    current_location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    next_location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    final_location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },

    estimated_duration: { type: Number, required: true }, // Estimated duration in minutes
    distance: { type: Number, required: true }, // Total distance in km

}, { timestamps: true });

const Route = mongoose.model("Route", routeSchema);
export default Route;
