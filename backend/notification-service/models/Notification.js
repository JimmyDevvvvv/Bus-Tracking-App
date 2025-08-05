import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  type: {
    type: String,
    enum: ['ANNOUNCEMENT', 'EMERGENCY', 'ROUTE_UPDATE', 'ARRIVAL', 'DELAY', 'CUSTOM'],
    required: true
  },
  category: {
    type: String,
    enum: ['ALL_CLEAR', 'TRAFFIC', 'ACCIDENT', 'DELAYED', null],
    default: null
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    estimatedTime: String,
    delayMinutes: Number,
    weatherInfo: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for efficient queries
notificationSchema.index({ recipientIds: 1, createdAt: -1 });
notificationSchema.index({ busId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isUrgent: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema); 