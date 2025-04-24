import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './db/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/Admin.js';
import driverRoutes from './routes/Driver.js';
import studentRoutes from './routes/Student.js';
import chatSocket from './socket/chatSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5003;

// Connect to the database
connectDB();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World! Sockets are live!');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);

// Initialize chat socket logic
chatSocket(io);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
