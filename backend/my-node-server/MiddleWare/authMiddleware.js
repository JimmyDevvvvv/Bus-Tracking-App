import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure JWT_SECRET is available
const JWT_SECRET = process.env.NODE_ENV === 'test' 
    ? 'test-secret-key'
    : process.env.JWT_SECRET || 'fallback_secret_key_for_development_only';

// Generate Token
export const generateToken = (user) => {
    if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        throw new Error('JWT configuration error');
    }
    return jwt.sign(
        { 
            id: user._id, 
            name: user.name,
            email: user.email,
            role: user.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
    );
};

// Middleware to Verify Token
export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            return res.status(401).json({ error: 'Authentication failed' });
        }
    }
};

// Middleware for Role-Based Authorization
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to perform this action.' });
        }
        next();
    };
};
