import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Basic profile
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  profilePicture: { type: String },
  role: { type: String, enum: ['admin', 'driver', 'student'], default: 'student' },
  isActive: { type: Boolean, default: true },

  // Admin-specific
  permissions: { type: [String], default: [] },

  // Driver-specific
  licenseNumber: { type: String },
  assignedBusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    address: String
  },

  // Student-specific
  studentId: { type: String },
  grade: { type: String },
  pickupTime: { type: String, default: '7:45 AM' },
  pickupStatus: { type: String, enum: ['on time', 'late', 'absent'], default: 'on time' },
  parentContactInfo: [{
    name: { type: String },
    phone: { type: String },
    email: { type: String }
  }],
  pickupLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    address: String
  },
  dropoffLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    address: String
  },

  // Activity timestamps
  lastLogin: { type: Date },
  lastActive: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema); 