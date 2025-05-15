// models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic profile
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  phone:          { type: String },
  profilePicture: { type: String },
  role:           { type: String, enum: ['admin','driver','student'], default: 'student' },
  isActive:       { type: Boolean, default: true },

  // Activity timestamps
  lastLogin:      { type: Date },
  lastActive:     { type: Date },

  // Admin-specific
  permissions:    { type: [String], default: [] },

  // Driver-specific
  licenseNumber:  { type: String },
  assignedBusId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  currentLocation:{
    latitude:     Number,
    longitude:    Number,
    timestamp:    Date,
    address:      String
  },

  // Student-specific
  studentId:      { type: String },
  grade:          { type: String },
  parentContactInfo: [{
    name:         { type: String },
    phone:        { type: String },
    email:        { type: String }
  }],
  pickupLocation: {
    latitude:     Number,
    longitude:    Number,
    timestamp:    Date,
    address:      String
  },
  dropoffLocation:{
    latitude:     Number,
    longitude:    Number,
    timestamp:    Date,
    address:      String
  },

  // Authentication & sessions
  mfaEnabled:     { type: Boolean, default: false },
  otp:            { type: String },
  otpExpires:     { type: Date },
  sessionLogs: [{
    startTime:    { type: Date },
    endTime:      { type: Date },
    ipAddress:    { type: String },
    device:       { type: String }
  }]
}, {
  timestamps: true  // Adds createdAt & updatedAt
});

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Keep updatedAt fresh on findOneAndUpdate
userSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// Instance method to check password
userSchema.methods.isValidPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

mongoose.model('User', userSchema);
export default mongoose.model('User');
