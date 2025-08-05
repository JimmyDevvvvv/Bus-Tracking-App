import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['profile', 'bus', 'document', 'image', 'other'],
    default: 'other'
  },
  tags: [{
    type: String
  }],
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // for videos
    thumbnail: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ category: 1 });
fileSchema.index({ isPublic: 1 });
fileSchema.index({ isDeleted: 1 });

export default mongoose.model('File', fileSchema); 