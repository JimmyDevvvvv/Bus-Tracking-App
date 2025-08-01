// controllers/authController.js
 
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import multer from 'multer'
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateToken } from '../middleware/authMiddleware.js'
import User from '../models/user.js'


const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${req.user.id}-${Date.now()}.${ext}`)
  }
})
export const upload = multer({ storage })

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, error: 'User already exists' })
    }
    const newUser = new User({ name, email, password, role })
    await newUser.save()
    res.status(201).json({ success: true, message: 'User registered successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const loginUser = async (req, res) => {
  const { email, password, otp } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
    if (user.mfaEnabled) {
      if (!otp) {
        return res.status(400).json({ success: false, error: 'OTP required' })
      }
      if (otp !== user.otp || user.otpExpires < new Date()) {
        return res.status(401).json({ success: false, error: 'Invalid or expired OTP' })
      }
      user.otp = null
      user.otpExpires = null
      await user.save()
    }
    const token = generateToken(user)
    res.json({ success: true, message: 'Login successful', token })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  })
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  })
}

export const enableMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    const otp = crypto.randomInt(100000, 999999).toString()
    user.mfaEnabled = true
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 10*60*1000)
    await user.save()
    await sendOTPEmail(user.email, otp)
    res.json({ success: true, message: 'MFA enabled; OTP sent to your email' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { lastLogin: new Date() })
    res.json({ success: true, message: 'Logout successful' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpires -sessionLogs')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let assignedBusId = user.assignedBusId || null;
    let pickupLocation = user.pickupLocation || null;

    if (user.role === 'driver') {
      const bus = await Bus.findOne({ driver_id: user._id }).lean();
      if (bus) {
        assignedBusId = bus._id.toString();
        pickupLocation = bus.currentLocation || null;
      }
    }

    if (user.role === 'student') {
      const bus = await Bus.findOne({ studentsAssigned: user._id }).lean();
      if (bus) assignedBusId = bus._id.toString();
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        role: user.role,
        assignedBusId,
        pickupLocation: pickupLocation || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, pickupLocation, dropoffLocation } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    if (pickupLocation) {
      updates.pickupLocation = typeof pickupLocation === "string"
        ? JSON.parse(pickupLocation)
        : pickupLocation;
    }

    updates.dropoffLocation = {
      address: "Administrative Capital, Regional Ring Rd, Cairo Governorate Desert, Cairo Governorate 4824208, Egypt",
      latitude: 30.005095,
      longitude: 31.700394
    };

    if (req.file) {
      const relPath = `/${path.relative(process.cwd(), req.file.path).replace(/\\/g, "/")}`;
      const host = `${req.protocol}://${req.get("host")}`;
      updates.profilePicture = `${host}${relPath}`;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true })
      .select("-password -otp -otpExpires -sessionLogs")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error("updateCurrentUser error:", err);
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ success: false, error: "Email already in use" });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};