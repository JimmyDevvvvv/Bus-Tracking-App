# 🚌 Bus Tracking System - Admin Panel

[![Status](https://img.shields.io/badge/Status-Active-success)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()
[![Node](https://img.shields.io/badge/Node-18.x-green)]()
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black)]()
[![React](https://img.shields.io/badge/React-18.x-blue)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)]()

## 📋 Table of Contents
- [Overview](#-overview)
- [Features & Milestones](#-features--milestones)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [API Documentation](#-api-documentation)
- [Setup & Usage](#-setup--usage)
- [Roadmap](#-roadmap)
- [Contributors](#-contributors)

## 🔍 Overview

The Bus Tracking System's Admin Panel provides university administrators with a comprehensive interface to manage all aspects of the campus transportation system. It enables real-time monitoring of the bus fleet, user account management, report handling, and data analytics through an intuitive dashboard.

This centralized management hub empowers administrators to oversee the transportation operation efficiently, providing tools for data-driven decision making and streamlined administrative workflows.

## 🌟 Features & Milestones

The following functionality has been successfully implemented:

### User Management System
- Complete CRUD operations for all user types (administrators, drivers, students)
- Role-based user administration with appropriate permissions
- User status management (activation/deactivation)
- User filtering by role, status, and search term

### Bus Fleet Management
- Comprehensive bus registration and tracking
- Driver assignment and reassignment
- Detailed bus information tracking (model, capacity, status)
- Status filtering and search capabilities

### Report Management
- Issue tracking system with categorization
- Status progression tracking
- Comment system with internal/external visibility
- Assignment workflow for report resolution

### Analytics Dashboard
- Key performance indicators with trend indicators
- Multi-dimensional analysis across user engagement, bus operations, and reports
- Interactive data visualizations using Recharts
- Time-range filtering for all metrics
- Export functionality for reports

### System Settings
- Global configuration management
- Notification settings
- Security controls and policies
- Data management options

## 🏗️ Project Structure

The project follows a structured organization with two main components:

### Frontend Architecture
The frontend is built with Next.js 14 using the App Router, TypeScript, and Tailwind CSS with Shadcn UI components.

**Admin Panel Structure** (`frontend/app/admin/`):
- `page.tsx` - Main admin dashboard with statistics and quick links
- `users/` - User management with CRUD operations and filtering
- `buses/` - Bus fleet management with status filtering
- `reports/` - Report listing and management with comment system
- `analytics/` - Data visualization dashboard with multiple chart types
- `settings/` - System-wide settings management

### Backend Architecture
The backend uses Node.js with Express, following an MVC pattern with MongoDB as the database.

**Admin API Structure** (`backend/my-node-server/`):
- Controllers for handling admin-specific logic
- Routes for API endpoint definitions
- MongoDB models for data structure
- Authentication middleware for security

For detailed structure information, refer to [project_structure.md](project_structure.md).

## 🛠️ Technology Stack

### Backend
- **Node.js & Express.js**: Server framework
- **MongoDB & Mongoose**: Database and ODM
- **JWT**: Authentication mechanism
- **Socket.io**: Real-time communication

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Component library
- **Recharts**: Data visualization library

### DevOps
- **Git**: Version control
- **Jest & Supertest**: Testing frameworks

## 🔄 API Documentation

The Admin Panel implements these key API endpoints:

### User Management API
- `GET /admin/users` - List all users with filtering options
- `POST /admin/users` - Create a new user
- `GET /admin/users/:id` - Retrieve a specific user
- `PUT /admin/users/:id` - Update user information
- `DELETE /admin/users/:id` - Delete a user

### Bus Management API
- `GET /admin/buses` - List all buses with status filtering
- `POST /admin/bus` - Create a new bus
- `GET /admin/bus/:id` - Retrieve a specific bus
- `PUT /admin/bus/:id` - Update bus information
- `DELETE /admin/bus/:id` - Delete a bus
- `POST /admin/bus/assign-driver` - Assign driver to bus

### Report Management API
- `GET /admin/reports` - List all reports with filtering
- `GET /admin/reports/:id` - View a specific report with comments
- `PUT /admin/reports/:id` - Update report status
- `POST /admin/reports/:id/comments` - Add a comment to a report
- `POST /admin/reports/:id/assign` - Assign report to an admin

### Analytics API
- `GET /admin/analytics/overview` - Dashboard statistics with trends
- `GET /admin/analytics/usage` - Usage data with time filtering
- `GET /admin/analytics/buses` - Bus performance metrics
- `GET /admin/analytics/reports` - Report distribution metrics
- `GET /admin/analytics/export` - Export analytics as CSV

For detailed API specifications, see [project_structure.md](project_structure.md#api-documentation).

## 📥 Setup & Usage

### Installation

```bash
# Clone the repository
git clone https://github.com/omarbadrawyyy/bus-tracking.git

# Navigate to project directory
cd bus-tracking

# Install backend dependencies
cd backend/my-node-server
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret

# Start the backend server
npm run start:dev

# In a new terminal, install frontend dependencies
cd ../../frontend
npm install

# Start the frontend development server
npm run dev
```

### Authentication Example

```javascript
// Example authentication request
const loginAdmin = async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'securepassword'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.token);
  }
};

// Example authenticated API request
const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/admin/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

## 🚀 Roadmap

### Current Development Focus
- **Advanced User Management**: Bulk operations, activity tracking, permission groups
- **Enhanced Bus Management**: Maintenance scheduling, historical tracking, performance metrics
- **Comprehensive Report System**: Advanced categorization, prioritization algorithms, SLA tracking

### Future Enhancements
- **Performance Optimization**: Pagination, caching strategies, API response optimization
- **Advanced Analytics**: Predictive analytics, custom report builder, comparative analysis
- **Admin Experience Refinement**: Usability testing, workflow improvements, documentation

For more details on planned enhancements, refer to [objectives.md](objectives.md).

## 👥 Contributors

- **Omar Badrawy** - Project Admin Operations Developer

---

**Last Updated:** May 11, 2025  
**Version:** 2.0.0
