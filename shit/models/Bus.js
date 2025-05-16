import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
    bus_id: { type: String, required: true, unique: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Waiting', 'Arrived', 'Passed'], default: 'Waiting' },
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    studentsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);
export default Bus;
