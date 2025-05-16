// server.js
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

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app    = express()
const server = http.createServer(app)

// — Configure Socket.IO with CORS —
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET','POST','PATCH','PUT','DELETE'],
    credentials: true
  }
})
app.set('io', io)

// — Connect to MongoDB —
if (process.env.NODE_ENV !== 'test') {
  connectDB()
}

// — Global middleware —
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files under `/uploads`
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
)

// — Socket.IO handlers —
io.on('connection', socket => {
  socket.on('join-bus-room', ({ busId }) => {
    socket.join(`bus-${busId}`)
  })

  socket.on('location-update', ({ busId, latitude, longitude }) => {
    Bus.findByIdAndUpdate(busId, {
      currentLocation: { latitude, longitude, timestamp: new Date() }
    }).exec()

    io.to(`bus-${busId}`).emit('bus-location', {
      latitude,
      longitude,
      timestamp: new Date()
    })
  })

  // Periodically emit dummy bus data (corrected format)
  // setInterval(() => {
  //   io.emit('bus-location', {
  //     latitude: 30.1234,
  //     longitude: 31.1234,
  //     eta: "5 mins"
  //   })
  // }, 100000)
})

// — REST API routes —
app.use('/api/auth',    authRoutes)
app.use('/api/admin',   adminRoutes)
app.use('/api/driver',  driverRoutes)
app.use('/api/student', studentRoutes)
app.use('/api',         busRoutes)

app.get('/', (req, res) => {
  res.send('Hello, World! Sockets are live!')
})

// — Chat socket logic —
chatSocket(io)

// — Global error handler —
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
})

// — Start server —
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5002
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
export { server, io }
