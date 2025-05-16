import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './db/db.js'
import authRoutes from './Routes/authRoutes.js'
import adminRoutes from './Routes/Admin.js'
import driverRoutes from './Routes/Driver.js'
import studentRoutes from './Routes/Student.js'
import chatSocket from './socket/chatSocket.js'
import busRoutes from './Routes/busRoutes.js'
import Bus from './models/Bus.js'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

dotenv.config()
const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET','POST','PATCH'] }
})
app.set("io", io);
// DB
if (process.env.NODE_ENV !== 'test') connectDB()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// **Serve uploads at /uploads**
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
)

io.on('connection', socket => {
  // driver joins a room for their bus
  socket.on('join-bus-room', ({ busId }) => {
    socket.join(`bus-${busId}`);
  });

  // driver sends location updates
  socket.on('location-update', ({ busId, latitude, longitude }) => {
    // persist to DB if you want:
    Bus.findByIdAndUpdate(busId, { currentLocation: { latitude, longitude, timestamp: new Date() } }).exec();
    // broadcast to students in that room
    io.to(`bus-${busId}`).emit('bus-location', { latitude, longitude, timestamp: new Date() });
  });
});


// Routes
app.use('/api/auth',   authRoutes)
app.use('/api/admin',  adminRoutes)
app.use('/api/driver', driverRoutes)
app.use('/api/student',studentRoutes)
app.use('/api/bus', busRoutes)

app.get('/', (req, res) => {
  res.send('Hello, World! Sockets are live!')
})

// Chat socket
chatSocket(io)

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
})

// Listen
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5002
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
export { server, io }
