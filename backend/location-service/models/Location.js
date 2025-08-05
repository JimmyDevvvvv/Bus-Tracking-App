import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    accuracy: { type: Number },
    speed: { type: Number },
    heading: { type: Number }
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'offline'],
    default: 'active'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    batteryLevel: { type: Number },
    signalStrength: { type: Number },
    deviceInfo: { type: String }
  }
}, {
  timestamps: true
});

// Index for efficient queries
locationSchema.index({ busId: 1, timestamp: -1 });
locationSchema.index({ driverId: 1, timestamp: -1 });

export default mongoose.model('Location', locationSchema); 