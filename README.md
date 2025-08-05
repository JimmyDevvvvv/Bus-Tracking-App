# Bus Tracking System - Microservices Architecture

A comprehensive bus tracking system built with a microservices architecture using Node.js, Express, MongoDB, Redis, and Docker.

## 🏗️ Architecture Overview

The system is divided into 8 microservices, each handling a specific domain:

### Services

1. **API Gateway** (Port: 3000)
   - Routes requests to appropriate microservices
   - Handles authentication and authorization
   - Rate limiting and security middleware
   - Load balancing and service discovery

2. **Auth Service** (Port: 3001)
   - User authentication and authorization
   - JWT token management
   - Multi-factor authentication (MFA)
   - Password management

3. **User Service** (Port: 3002)
   - User profile management
   - Role-based access control
   - Student and driver management
   - User location tracking

4. **Bus Service** (Port: 3003)
   - Bus fleet management
   - Route planning and assignment
   - Driver and student assignments
   - Bus status tracking

5. **Location Service** (Port: 3004)
   - Real-time location tracking
   - GPS data processing
   - Location history and analytics
   - WebSocket connections for live updates

6. **Chat Service** (Port: 3005)
   - Real-time messaging
   - Chat rooms for buses
   - Message history and management
   - File sharing in chats

7. **Notification Service** (Port: 3006)
   - Push notifications
   - Email notifications
   - Announcements and alerts
   - Notification preferences

8. **File Service** (Port: 3007)
   - File upload and management
   - Image processing and thumbnails
   - Document storage
   - File access control

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB (handled by Docker)
- Redis (handled by Docker)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key
```

### Running the Application

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Start specific services:**
   ```bash
   docker-compose up api-gateway auth-service user-service
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f [service-name]
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

## 📁 Project Structure

```
Bus-Tracking-App/
├── backend/
│   ├── api-gateway/          # API Gateway Service
│   ├── auth-service/         # Authentication Service
│   ├── user-service/         # User Management Service
│   ├── bus-service/          # Bus Management Service
│   ├── location-service/     # Location Tracking Service
│   ├── chat-service/         # Chat & Messaging Service
│   ├── notification-service/ # Notification Service
│   └── file-service/         # File Management Service
├── frontend/                 # React/Next.js Frontend
├── docker-compose.yml        # Docker Compose Configuration
└── README.md
```

## 🔧 Service Details

### API Gateway
- **Port:** 3000
- **Purpose:** Single entry point for all API requests
- **Features:**
  - Request routing to microservices
  - JWT token verification
  - Rate limiting
  - CORS handling
  - Load balancing

### Auth Service
- **Port:** 3001
- **Database:** MongoDB (authdb)
- **Features:**
  - User registration and login
  - JWT token generation
  - Multi-factor authentication
  - Password reset
  - Session management

### User Service
- **Port:** 3002
- **Database:** MongoDB (userdb)
- **Features:**
  - User profile management
  - Role-based permissions
  - Student and driver profiles
  - Location tracking for users

### Bus Service
- **Port:** 3003
- **Database:** MongoDB (busdb)
- **Features:**
  - Bus fleet management
  - Route planning
  - Driver assignments
  - Student assignments
  - Bus status tracking

### Location Service
- **Port:** 3004
- **Database:** MongoDB (locationdb)
- **Features:**
  - Real-time GPS tracking
  - Location history
  - Route analytics
  - WebSocket connections
  - Emergency alerts

### Chat Service
- **Port:** 3005
- **Database:** MongoDB (chatdb)
- **Features:**
  - Real-time messaging
  - Chat rooms per bus
  - Message history
  - File sharing
  - Read receipts

### Notification Service
- **Port:** 3006
- **Database:** MongoDB (notificationdb)
- **Features:**
  - Push notifications
  - Email notifications
  - Announcements
  - Notification preferences
  - Emergency broadcasts

### File Service
- **Port:** 3007
- **Database:** MongoDB (filedb)
- **Features:**
  - File upload/download
  - Image processing
  - Thumbnail generation
  - Access control
  - File categorization

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/me          # Get current user
POST /api/auth/mfa/enable  # Enable MFA
POST /api/auth/mfa/disable # Disable MFA
```

### Users
```
GET    /api/users           # Get all users
GET    /api/users/:id       # Get user by ID
POST   /api/users           # Create user
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
GET    /api/students        # Get students
GET    /api/drivers         # Get drivers
```

### Buses
```
GET    /api/buses           # Get all buses
GET    /api/buses/:id       # Get bus by ID
POST   /api/buses           # Create bus
PUT    /api/buses/:id       # Update bus
DELETE /api/buses/:id       # Delete bus
PUT    /api/buses/:id/assign-driver    # Assign driver
PUT    /api/buses/:id/assign-students  # Assign students
```

### Location
```
POST   /api/location/update           # Update location
GET    /api/location/bus/:busId       # Get bus location
GET    /api/location/active-buses     # Get active buses
GET    /api/location/stats            # Get location stats
```

### Chat
```
GET    /api/chat/rooms                # Get user's chat rooms
GET    /api/chat/rooms/:busId         # Get/create chat room
GET    /api/chat/rooms/:roomId/messages # Get messages
POST   /api/chat/messages             # Send message
PUT    /api/chat/rooms/:roomId/read   # Mark as read
```

### Notifications
```
POST   /api/notifications             # Create notification
GET    /api/notifications             # Get user notifications
PUT    /api/notifications/:id/read   # Mark as read
DELETE /api/notifications/:id         # Delete notification
```

### Files
```
POST   /api/files/upload              # Upload file
GET    /api/files                     # Get user's files
GET    /api/files/:id                 # Get file by ID
PUT    /api/files/:id                 # Update file
DELETE /api/files/:id                 # Delete file
GET    /api/files/:id/download        # Download file
```

## 🔐 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Rate Limiting:** Prevents abuse and DDoS attacks
- **CORS Protection:** Cross-origin request handling
- **Helmet Security:** HTTP headers security
- **Input Validation:** Request data validation
- **Role-based Access:** Granular permissions

## 📊 Real-time Features

- **WebSocket Connections:** Real-time updates
- **Live Location Tracking:** GPS updates every few seconds
- **Instant Messaging:** Real-time chat functionality
- **Push Notifications:** Immediate alerts and announcements
- **Live Bus Status:** Real-time bus location and status

## 🗄️ Database Design

Each service has its own MongoDB database:

- **authdb:** Authentication and user sessions
- **userdb:** User profiles and management
- **busdb:** Bus fleet and route data
- **locationdb:** GPS and tracking data
- **chatdb:** Messages and chat rooms
- **notificationdb:** Notifications and announcements
- **filedb:** File metadata and storage info

## 🔄 Message Broker

Redis is used as a message broker for:
- Inter-service communication
- Caching frequently accessed data
- Session storage
- Real-time event distribution

## 🐳 Docker Configuration

All services are containerized with:
- **Base Image:** Node.js 18 Alpine
- **Port Mapping:** Each service exposes its port
- **Volume Mounting:** For persistent data
- **Environment Variables:** Service-specific configuration
- **Health Checks:** Service availability monitoring

## 🚀 Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
# Set environment variables
export NODE_ENV=production

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Monitoring and Logging

- **Health Checks:** Each service has `/health` endpoint
- **Logging:** Structured logging with timestamps
- **Error Handling:** Comprehensive error management
- **Performance:** Request/response time monitoring

## 🔧 Development

### Adding a New Service

1. Create service directory in `backend/`
2. Add service to `docker-compose.yml`
3. Create Dockerfile for the service
4. Add service routes to API Gateway
5. Update documentation

### Local Development

```bash
# Install dependencies for a service
cd backend/[service-name]
npm install

# Run service locally
npm run dev

# Run with hot reload
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ using Node.js, Express, MongoDB, Redis, and Docker**


