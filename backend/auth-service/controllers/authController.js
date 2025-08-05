import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { generateToken } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, otp } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    if (user.mfaEnabled) {
      if (!otp) {
        return res.status(400).json({ 
          success: false, 
          error: 'OTP required' 
        });
      }
      if (otp !== user.otp || user.otpExpires < new Date()) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid or expired OTP' 
        });
      }
      user.otp = null;
      user.otpExpires = null;
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user);
    
    res.json({ 
      success: true, 
      message: 'Login successful', 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

export const enableMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.mfaEnabled = true;
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp);
    
    res.json({ 
      success: true, 
      message: 'MFA enabled; OTP sent to your email' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

export const disableMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    user.mfaEnabled = false;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'MFA disabled successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // In a microservices architecture, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ 
      success: true, 
      user 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password is incorrect' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}; 