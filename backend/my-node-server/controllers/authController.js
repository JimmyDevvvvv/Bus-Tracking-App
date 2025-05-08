import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/authMiddleware.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const newUser = new User({ name, email, password, role });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

        if (user.mfaEnabled) {
            if (!otp) return res.status(400).json({ error: 'OTP required' });

            if (otp !== user.otp || user.otpExpires < new Date()) {
                return res.status(401).json({ error: 'Invalid or expired OTP' });
            }

            // Clear OTP after successful verification
            user.otp = null;
            user.otpExpires = null;
            await user.save();
        }

        const token = generateToken(user);
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });


    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
};



export const enableMFA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        user.mfaEnabled = true;
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTPEmail(user.email, otp);

        res.json({ message: 'MFA enabled. OTP sent to your email.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

