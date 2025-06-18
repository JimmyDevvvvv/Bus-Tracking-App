# University Bus Tracking Application

## 🌍 Overview

The **University Bus Tracking Application** is an end-to-end smart transportation solution designed to resolve long-standing issues in university and school bus systems, including delays, overcrowding, poor communication, and missed schedules. It enables live GPS tracking, dynamic ETA calculations, and direct student-driver communication while offering centralized control to administrators for route and user management.

This system was developed as a semester-long project for BSAD 603 (Project Management) by a team of cybersecurity and software engineering students using Agile methodologies and user-centered design. With a heavy emphasis on real-world feedback and usage metrics, the application not only meets the minimum functional requirements but goes further in ensuring transparency, security, and user satisfaction across all roles.

## 🚀 Project Motivation & Problem Statement

Universities frequently struggle to manage transportation logistics efficiently. Based on collected data:

- 53.1% of students reported frequent delays.
- 53.1% cited overcrowding.
- 12.5% reported missed classes due to poor transit reliability.
- 46.9% requested better communication with drivers.

The current systems lack real-time data, manual coordination is slow, and reporting problems (like reckless driving or overloading) is often ignored. Our application resolves these issues through an intuitive web platform with role-based access and automation.

## 💼 Business Case & Target Audience

### Problem Addressed:

- Frequent Delays: Inability to track live locations.
- Overcrowding & Miscommunication: No transparent data or alerts.
- Missed Classes: No proximity warnings or ETA.

### Value Proposition:

- 75% of surveyed users desired real-time GPS.
- 71.9% requested ETA notifications.
- 96.9% demanded reporting tools.

### Target Users:

- Students who want reliable schedules and tracking.
- Drivers who need simplified UIs and route intelligence.
- Admins who manage assignments, analytics, and reports.

### Benefits:

- Improved academic punctuality.
- Safer, more efficient rides.
- Stronger trust between students and administration.

## 🌐 Live System Features

### Core MVP Features:

- **GPS Tracking:** Live bus positions updated every second.
- **ETA Estimation:** Based on dynamic traffic and route history.
- **Arrival Alerts:** Triggered 3–5 minutes before stops.
- **Two-Way Messaging:** Between students and assigned drivers.
- **Admin Dashboard:** Visual route management, analytics, and complaint resolution.
- **Student Complaints:** Categorized submissions visible to admins.
- **Driver Tools:** Upcoming stops, emergency alerting, and trip oversight.
- **Data Export:** Admins can extract trip data and usage metrics.
- **Role-Based Dashboards:** Authenticated portals for all roles.
- **Trip History:** Students can access previous ride details.

## 📊 Technologies Used

- **Frontend:** Next.js (React)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Cloud Hosted)
- **Auth:** JWT-based with role validation
- **Real-Time Comms:** Socket.IO
- **Maps & Geolocation:** Google Maps API
- **Deployment:** Docker (Optional), GitHub

## ⚖️ Role-Specific Features

### 👨‍🎓 Student Portal

- View assigned bus, driver, and ETA.
- Receive pop-up notifications for proximity or delays.
- Submit structured complaints.
- Chat in real-time with driver.
- View full profile and trip history.

### 🚓 Driver Dashboard

- View list of enrolled students.
- Push arrival alerts manually.
- Access live route map with next stop indicator.
- View delay codes and emergency flags.
- Communicate directly with students.

### 👨‍💼 Admin Interface

- View/manage student-bus-driver assignments.
- CRUD routes dynamically on a map.
- View and export analytical data.
- Respond to student complaints.
- Oversee entire system from one dashboard.

## ⚙️ Installation & Deployment

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/university-bus-tracker.git

# 2. Navigate to backend & install dependencies
cd backend
npm install
npm run dev

# 3. Navigate to frontend & install dependencies
cd ../frontend
npm install
npm run dev

# 4. Set environment variables (Maps API, Mongo URI, JWT Secret)
touch .env
```

## 🔄 Agile Development Lifecycle

The project was developed over **3 major sprints**:

### ▶️ Sprint 1: Backend Foundation

- APIs for real-time GPS data, complaints, messaging.
- MongoDB schema design.
- Role-based authentication (JWT).

### ▶️ Sprint 2: Frontend + UX

- React components for all roles.
- Live map rendering with ETA.
- Real-time alerts and chat system UI.

### ▶️ Sprint 3: Integration & Testing

- End-to-end testing of front+back.
- Real-time Socket.IO tuning.
- Final bug fixes, optimization, and deployment testing.

## 👨‍📋 Team & Roles

| Name | Role | Contributions |
|------|------|---------------|
| Ahmed Hegab | Scrum Master | Sprint coordination, backend support, Agile facilitation,Communication Module,Google Maps API |
| Mohamed Gamal (Jimmy) | Product Owner | Driver Panel, Admin Management, UI Design, Dashboard integration |
| Maryam Kashif | Business analyst + Backend Developer | Contributed to the development of backend APIs for the Driver module and contributed to writing reports, deliverables, documentation, and project presentations |
| Ammar Hassona | Developer | GPS logic, Google Maps API, ETA calculations |
| Aly Mostafa | Developer | Student dashboard, profile, complaint UI |
| Omar Badrawy | Developer | Admin dashboard, route editing, student-bus assignment |
| Abdullah Mohamed | Developer | complaints schema, chat performance tuning |
| Abdelrahman Ibrahim | Developer |CSV export, permission enforcement |

## ⌛ Performance Metrics

| Metric | Target Goal |
|--------|-------------|
| GPS Latency | < 2 seconds |
| Notification Delivery | < 5 seconds |
| ETA Recalculation | Every 30 seconds |
| Admin Dashboard Sync | < 1 minute |
| Chat Round-Trip Time | < 1 second |
| Backend Uptime | 99.9% |
| Adoption Target | 80% of user base |

## ⚡ Project Timeline

| Milestone | Planned | Actual |
|-----------|---------|--------|
| Project Initialization | 21/02/2025 | 24/02/2025 |
| Requirements Gathering | 04/03/2025 | 06/03/2025 |
| Backend Development | 03/04/2025 | 03/04/2025 |
| Frontend Development | 16/04/2025 | 20/04/2025 |
| Testing & QA | 03/05/2025 | 05/05/2025 |

## ❓ Key Lessons & Challenges

### Technical:

- Choosing the right GPS API required deep benchmarking.
- Real-time messaging involved tuning WebSockets for 1s round-trip times.
- Role-based UI/UX demanded conditional rendering and secure data access.

### Organizational:

- Deadline crunch due to other course deliverables.
- Live integration under tight sprints made testing more stressful.
- Cross-team coordination needed stronger stand-up documentation.

## 🚀 Future Improvements

- **Granular Location Consent:** Enable limited-time or stop-based sharing to protect user privacy.
- **Mobile App Version:** Flutter-based native version for students.
- **Driver Training Module:** Interactive onboarding inside dashboard.
- **Push Notifications:** Using Firebase or native OS channels.
- **Trip Forecasting:** Using historical GPS to suggest optimized routes.
- **Offline Caching:** Support for poor connectivity zones.

## 👉 Quick Links

- 📊 [User Survey Data](https://docs.google.com/spreadsheets/d/1UHge81XDs9RyOY2iUrLziqTCGUBtrn6v0CaNlR7lDxQ)
- 🔎 API Tracker *(coming soon)*
- 🔹 Project Gantt Chart *(coming soon)*

## ✍️ License & Disclaimer

This project is part of BSAD 603 — Project Management at GIU. The application is developed for academic, demonstrative, and non-commercial purposes. All rights reserved by the team members.

## 🙏 Acknowledgments

We would like to express gratitude to all users who participated in surveys, offered feedback, and helped validate the system under real conditions. Special thanks to the project supervisors and teaching staff for their guidance.


https://github.com/user-attachments/assets/3ba6756e-35aa-41b9-baf3-7d2fe7a9f792


https://github.com/user-attachments/assets/199f3745-5b2c-4e78-bf74-b76fdba32d17


