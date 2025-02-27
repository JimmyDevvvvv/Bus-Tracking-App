import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './db/db.js';
import authRoutes from './Routes/authRoutes.js';
import adminRoutes from './Routes/Admin.js';
import driverRoutes from './Routes/Driver.js';
import studentRoutes from './Routes/Student.js';
import busRoutes from './Routes/BusRoutes.js';
import chatSocket from './socket/chatSocket.js';
import locationRoutes from './Routes/location.js';
import routeRoutes from './Routes/routes.js';

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
app.use('/api/buses', busRoutes);
app.use("/api/locations", locationRoutes);
app.use('/api/routes', routeRoutes);

// Initialize chat socket logic
chatSocket(io);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
