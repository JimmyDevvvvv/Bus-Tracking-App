import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['driver', 'student', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  lastMessage: {
    content: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowStudents: {
      type: Boolean,
      default: true
    },
    allowDrivers: {
      type: Boolean,
      default: true
    },
    allowAdmins: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatRoomSchema.index({ busId: 1 });
chatRoomSchema.index({ 'participants.userId': 1 });

export default mongoose.model('ChatRoom', chatRoomSchema); 