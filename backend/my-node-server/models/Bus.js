// models/Bus.js

import mongoose from 'mongoose';

const generateBusId = () => {
  const timestamp  = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `BUS-${timestamp}-${randomPart}`.toUpperCase();
};

const busSchema = new mongoose.Schema({
  // Unique identifier
  bus_id: {
    type:     String,
    unique:   true,
    required: true,
    default:  generateBusId
  },

  // Core info
  busNumber:    { type: String, required: true },
  model:        { type: String, required: true },
  capacity:     { type: Number, required: true },
  licensePlate: { type: String, required: true },
  year:         { type: Number, required: true },

  // Unified status
  status: {
    type: String,
    enum: [
      'active','maintenance','retired','inactive',  // maintenance stack
      'Waiting','Arrived','Passed'                  // real-time tracking
    ],
    default: 'active'
  },

  // Features
  fuelType:      { type: String, enum: ['diesel','gasoline','electric','hybrid','cng'], default: 'diesel' },
  isAccessible:  { type: Boolean, default: false },
  hasWifi:       { type: Boolean, default: false },
  hasUSBCharging:{ type: Boolean, default: false },

  // Maintenance
  lastMaintenance:{ type: Date },
  notes:          { type: String },

  // Routing
  campusRoute:    { type: String },
  operatingHours: { type: String },
  weekendService: { type: Boolean, default: false },

  // References
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  currentStudentCount:{ type: Number, default: 0 },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date }
  },
  
  locations:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],

  // Real-time tracking
  isOnRoute:        { type: Boolean, default: false },
  lastUpdated:      { type: Date, default: Date.now },

  // Detailed route info
  route: {
    id:               { type: String },
    name:             { type: String },
    stops: [{
      id:             { type: String },
      name:           { type: String },
      location: {
        latitude:     { type: Number },
        longitude:    { type: Number },
        address:      { type: String }
      },
      arrivalTime:    { type: String }, // "HH:MM"
      departureTime:  { type: String },
      studentIds:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    estimatedStartTime:{ type: String },
    estimatedEndTime:  { type: String },
    distance:         { type: Number }   // in km
  }
}, {
  timestamps: true
});

// Keep student count in sync
busSchema.pre('save', function(next) {
  if (this.isModified('studentsAssigned')) {
    this.currentStudentCount = this.studentsAssigned.length;
  }
  next();
});

mongoose.model('Bus', busSchema);
export default mongoose.model('Bus', busSchema);