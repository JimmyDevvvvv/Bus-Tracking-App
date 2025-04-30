import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    address: { type: String },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    isEndPoint: { type: Boolean, default: false },
    isStartPoint: { type: Boolean, default: false },
    isStop: { type: Boolean, default: false },
    stopName: { type: String },
    speed: { type: Number }, // in km/h
    heading: { type: Number }, // direction in degrees
    accuracy: { type: Number }, // GPS accuracy in meters
    altitude: { type: Number },
    stopDuration: { type: Number }, // duration in seconds if vehicle stopped here
    arrivedAt: { type: Date }, // when bus arrived at this location
    departedAt: { type: Date }, // when bus departed from this location
    routeId: { type: String }, // reference to the route this location is part of
    isScheduled: { type: Boolean, default: false }, // if this is a scheduled stop vs actual location
    scheduledArrival: { type: Date }, // scheduled arrival time if this is a stop
    actualArrival: { type: Date } // actual arrival time to compare with scheduled
}, { timestamps: true });

// Index for geospatial queries
locationSchema.index({ latitude: 1, longitude: 1 });
// Index for timestamp-based queries
locationSchema.index({ timestamp: -1 });
// Index for bus queries
locationSchema.index({ busId: 1, timestamp: -1 });

// Virtual for calculating distance from another point (if needed)
locationSchema.virtual('distanceFrom').method(function(lat, lng) {
    // Haversine formula for distance calculation
    const R = 6371; // Radius of the earth in km
    const dLat = (lat - this.latitude) * Math.PI / 180;
    const dLng = (lng - this.longitude) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
});

const Location = mongoose.model('Location', locationSchema);
export default Location;
