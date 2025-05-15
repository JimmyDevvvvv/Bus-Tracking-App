import mongoose from 'mongoose';

const generateBusId = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `BUS-${timestamp}-${randomPart}`.toUpperCase();

};

const busSchema = new mongoose.Schema({
    bus_id: { 
        type: String, 
        unique: true,
        default: generateBusId 
    },
    busNumber: { type: String, required: true },
    model: { type: String, required: true },
    capacity: { type: Number, required: true },
    licensePlate: { type: String, required: true },
    year: { type: Number, required: true },
    status: { 
        type: String,
        enum: ['active', 'maintenance', 'retired', 'inactive'],
        default: 'active'
    },
    fuelType: {
        type: String,
        enum: ['diesel', 'gasoline', 'electric', 'hybrid', 'cng'],
        default: 'diesel'
    },
    lastMaintenance: { type: Date },
    notes: { type: String },
    isAccessible: { type: Boolean, default: false },
    hasWifi: { type: Boolean, default: false },
    hasUSBCharging: { type: Boolean, default: false },
    trackingDeviceId: { type: String },
    campusRoute: { type: String },
    operatingHours: { type: String },
    weekendService: { type: Boolean, default: false },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    currentStudentCount: { type: Number, default: 0 },
    currentLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    studentsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // For real-time tracking
    isOnRoute: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    
    // Route information
    route: {
        id: { type: String },
        name: { type: String },
        stops: [{
            id: { type: String },
            name: { type: String },
            location: {
                latitude: { type: Number },
                longitude: { type: Number },
                address: { type: String }
            },
            arrivalTime: { type: String }, // Format: "HH:MM"
            departureTime: { type: String }, // Format: "HH:MM"
            studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }],
        estimatedStartTime: { type: String }, // Format: "HH:MM"
        estimatedEndTime: { type: String }, // Format: "HH:MM"
        distance: { type: Number } // in kilometers
    }
}, { timestamps: true });

// Middleware to update currentStudentCount when assignedStudentIds changes
busSchema.pre('save', function(next) {
    if (this.isModified('assignedStudentIds')) {
        this.currentStudentCount = this.assignedStudentIds.length;
    }
    next();
});

const Bus = mongoose.model('Bus', busSchema);
export default Bus;
