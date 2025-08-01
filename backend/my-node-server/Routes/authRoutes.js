import express from 'express';
import { registerUser,upload,updateCurrentUser , getCurrentUser,loginUser, enableMFA, logoutUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import multer from 'multer'
const router = express.Router();


router.post('/register', registerUser)
router.post('/login',    loginUser)
router.post('/logout',   verifyToken, logoutUser)
router.post('/enable-mfa', verifyToken, enableMFA)

router.get('/me',    verifyToken, getCurrentUser)
// **Single patch for profile + file upload**
router.patch(
  '/me',
  verifyToken,
  upload.single('profilePicture'),
  updateCurrentUser
)

export default router