import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    arrived: { type: Boolean, default: false },
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
export default Location;
