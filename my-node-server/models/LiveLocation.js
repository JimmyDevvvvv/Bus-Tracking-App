import mongoose from 'mongoose';

const LiveLocationSchema = new mongoose.Schema({
    bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bus",
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
});

const LiveLocation = mongoose.model("LiveLocation", LiveLocationSchema);
export default LiveLocation;