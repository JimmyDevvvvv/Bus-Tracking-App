import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['admin', 'driver', 'student'], default: 'student' },
    profilePicture: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    lastActive: { type: Date },
    
    // Admin-specific fields
    permissions: { type: [String], default: [] },
    
    // Driver-specific fields
    licenseNumber: { type: String },
    assignedBusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    currentLocation: {
        latitude: Number,
        longitude: Number,
        timestamp: Date,
        address: String
    },
    
    // Student-specific fields
    studentId: { type: String },
    grade: { type: String },
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
    
    // Authentication fields
    mfaEnabled: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    sessionLogs: [{
        startTime: { type: Date },
        endTime: { type: Date },
        ipAddress: { type: String },
        device: { type: String }
    }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check password validity
userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Update the updatedAt field
userSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const User = mongoose.model('User', userSchema);
export default User;
