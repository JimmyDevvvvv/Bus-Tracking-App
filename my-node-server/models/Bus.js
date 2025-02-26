import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
    bus_id: { type: String, required: true, unique: true }, // Unique bus identifier
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Driver reference
    status: { type: String, enum: ['Waiting', 'Arrived', 'Passed'], default: 'Waiting' }, // Status of the bus
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }], // Locations visited by the bus
    route: { type: String, required: true }, // The route the bus follows
    capacity: { type: Number, required: true }, // The bus capacity
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);
export default Bus;