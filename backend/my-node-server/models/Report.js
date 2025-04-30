import mongoose from 'mongoose';

// Define the schema for report comments
const reportCommentSchema = new mongoose.Schema({
    comment: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }
}, { timestamps: true });

// Define the main report schema
const reportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['maintenance', 'emergency', 'feedback', 'complaint'],
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
        default: 'pending'
    },
    submittedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },
    submittedAt: { 
        type: Date,
        default: Date.now
    },
    resolvedAt: { 
        type: Date,
        default: null
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    attachments: [{ 
        type: String 
    }],
    comments: [reportCommentSchema],
    relatedBusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        default: null
    }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
export default Report; 