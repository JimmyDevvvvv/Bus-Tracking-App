import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './db/connect.js';
import chatRoutes from './routes/chatRoutes.js';
import { setupChatSocket } from './socket/chatSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3005;

// Setup Socket.IO
const io = setupChatSocket(server);
app.set('io', io);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat Service is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/chat', chatRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chat Service',
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Chat Service error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

server.listen(PORT, () => {
  console.log(`Chat Service running on port ${PORT}`);
  console.log('Socket.IO server is ready for real-time chat');
}); 