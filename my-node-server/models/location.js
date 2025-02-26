import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    arrived: { type: Boolean, default: false },

    bus_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    
    eta: { type: Number, required: true },
    etaNext: { type: Number, required: true },

}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
export default Location;
