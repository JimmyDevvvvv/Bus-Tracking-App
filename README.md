# Bus Tracking System

A real-time bus tracking system with separate frontends for administrators, drivers, and students.

## Project Structure

The project is organized into two main parts:

- **Backend**: Node.js/Express server with MongoDB and Socket.IO
- **Frontend**: Next.js application with authentication and role-based access

## Requirements

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn package manager

## Getting Started

### Setting up MongoDB

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named "bus-tracking"

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend/my-node-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm run dev
   ```

The server will run on http://localhost:5003

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:3000

## Features

- **Real-time tracking**: Track buses in real-time using Socket.IO
- **Authentication**: Secure login and registration system
- **Role-based access**: Different interfaces for admins, drivers, and students
- **Route management**: Create, edit, and delete bus routes
- **Driver assignment**: Assign drivers to specific routes
- **Student notifications**: Notify students about bus arrivals

## Technology Stack

- **Backend**:
  - Node.js with Express
  - MongoDB with Mongoose
  - Socket.IO for real-time communication
  - JWT for authentication

- **Frontend**:
  - Next.js
  - React
  - Tailwind CSS
  - Socket.IO client

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://127.0.0.1:27017/bus-tracking
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5003/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5003
``` 