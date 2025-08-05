import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic profile
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'driver', 'student'], default: 'student' },
  isActive: { type: Boolean, default: true },

  // Authentication & sessions
  mfaEnabled: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  sessionLogs: [{
    startTime: { type: Date },
    endTime: { type: Date },
    ipAddress: { type: String },
    device: { type: String }
  }],

  // Activity timestamps
  lastLogin: { type: Date },
  lastActive: { type: Date }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to check password
userSchema.methods.isValidPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema); 