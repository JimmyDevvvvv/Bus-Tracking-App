// models/Location.js

import e from 'express';
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  // Core
  name:          { type: String },
  latitude:      { type: Number, required: true },
  longitude:     { type: Number, required: true },
  timestamp:     { type: Date, default: Date.now },

  // Associations
  busId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  routeId:       { type: String },

  // Stop details
  isStartPoint:     { type: Boolean, default: false },
  isEndPoint:       { type: Boolean, default: false },
  isStop:           { type: Boolean, default: false },
  isScheduled:      { type: Boolean, default: false },
  stopName:         { type: String },
  arrived:          { type: Boolean, default: false },
  arrivedAt:        { type: Date },
  scheduledArrival: { type: Date },
  actualArrival:    { type: Date },
  departedAt:       { type: Date },
  stopDuration:     { type: Number },

  // GPS telemetry
  speed:         { type: Number },
  heading:       { type: Number },
  accuracy:      { type: Number },
  altitude:      { type: Number },

  // Address
  address:       { type: String }
}, {
  timestamps: true
});

// Indexes
locationSchema.index({ latitude: 1, longitude: 1 });
locationSchema.index({ timestamp: -1 });
locationSchema.index({ busId: 1, timestamp: -1 });

// Virtual distance calculator
locationSchema.virtual('distanceFrom').method(function(lat, lng) {
  const R = 6371;
  const dLat = (lat - this.latitude) * Math.PI/180;
  const dLng = (lng - this.longitude) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(this.latitude * Math.PI/180) *
            Math.cos(lat * Math.PI/180) *
            Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
});

mongoose.model('Location', locationSchema);
export default mongoose.model('Location');