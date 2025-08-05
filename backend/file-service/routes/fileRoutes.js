import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadFile,
  getFile,
  getUserFiles,
  updateFile,
  deleteFile,
  getPublicFiles,
  downloadFile
} from '../controllers/fileController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    cb(null, `${req.headers['x-user-id']}-${timestamp}-${randomString}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and common file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// File management routes
router.post('/upload', upload.single('file'), uploadFile);
router.get('/files', getUserFiles);
router.get('/files/public', getPublicFiles);
router.get('/files/:id', getFile);
router.put('/files/:id', updateFile);
router.delete('/files/:id', deleteFile);
router.get('/files/:id/download', downloadFile);

export default router; 