import File from '../models/File.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Upload file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { category = 'other', tags = [], isPublic = false } = req.body;
    const uploadedBy = req.headers['x-user-id'];

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(req.file.originalname);
    const filename = `${uploadedBy}-${timestamp}-${randomString}${extension}`;

    // Create file record
    const fileData = {
      filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${filename}`,
      uploadedBy,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublic
    };

    // Process image files
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const image = sharp(req.file.path);
        const metadata = await image.metadata();
        
        fileData.metadata = {
          width: metadata.width,
          height: metadata.height
        };

        // Create thumbnail for large images
        if (metadata.width > 800 || metadata.height > 800) {
          const thumbnailPath = path.join(path.dirname(req.file.path), `thumb_${filename}`);
          await image.resize(300, 300, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbnailPath);
          fileData.metadata.thumbnail = `/uploads/thumb_${filename}`;
        }
      } catch (error) {
        console.error('Image processing error:', error);
      }
    }

    const file = new File(fileData);
    await file.save();

    res.status(201).json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get file by ID
export const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('uploadedBy', 'name email');
    
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    if (file.isDeleted) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    res.json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get user's files
export const getUserFiles = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { page = 1, limit = 20, category } = req.query;
    const skip = (page - 1) * limit;

    let query = { uploadedBy: userId, isDeleted: false };

    if (category) {
      query.category = category;
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email');

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      files,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalFiles: total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update file
export const updateFile = async (req, res) => {
  try {
    const { tags, isPublic, category } = req.body;
    const fileId = req.params.id;
    const userId = req.headers['x-user-id'];

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    if (file.uploadedBy.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updateData = {};
    if (tags !== undefined) {
      updateData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }
    if (category !== undefined) {
      updateData.category = category;
    }

    const updatedFile = await File.findByIdAndUpdate(
      fileId,
      updateData,
      { new: true }
    ).populate('uploadedBy', 'name email');

    res.json({ success: true, file: updatedFile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.headers['x-user-id'];

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    if (file.uploadedBy.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Soft delete
    file.isDeleted = true;
    file.deletedAt = new Date();
    file.deletedBy = userId;
    await file.save();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get public files
export const getPublicFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true, isDeleted: false };

    if (category) {
      query.category = category;
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email');

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      files,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalFiles: total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Download file
export const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file || file.isDeleted) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Check if user has access
    const userId = req.headers['x-user-id'];
    if (!file.isPublic && file.uploadedBy.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const filePath = path.join(process.cwd(), file.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on disk' });
    }

    res.download(filePath, file.originalName);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 