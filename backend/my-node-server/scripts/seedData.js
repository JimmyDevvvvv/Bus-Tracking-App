import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Bus from '../models/Bus.js';
import Report from '../models/Report.js';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bus-tracking');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Bus.deleteMany({});
    await Report.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      phone: '1234567890',
      isActive: true
    });
    console.log('Created admin user');

    // Create driver users
    const driverPassword = await bcrypt.hash('driver123', 10);
    const drivers = await User.create([
      {
        name: 'Driver One',
        email: 'driver1@example.com',
        password: driverPassword,
        role: 'driver',
        phone: '1234567891',
        isActive: true
      },
      {
        name: 'Driver Two',
        email: 'driver2@example.com',
        password: driverPassword,
        role: 'driver',
        phone: '1234567892',
        isActive: true
      }
    ]);
    console.log('Created driver users');

    // Create student users
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = await User.create([
      {
        name: 'Student One',
        email: 'student1@example.com',
        password: studentPassword,
        role: 'student',
        phone: '1234567893',
        isActive: true
      },
      {
        name: 'Student Two',
        email: 'student2@example.com',
        password: studentPassword,
        role: 'student',
        phone: '1234567894',
        isActive: true
      }
    ]);
    console.log('Created student users');

    // Create buses
    const buses = await Bus.create([
      {
        busNumber: 'BUS-001',
        licenseNumber: 'ABC123',
        licensePlate: 'ABC123',
        bus_id: 'BUS-001',
        model: 'Mercedes Sprinter',
        year: 2022,
        capacity: 30,
        currentStudentCount: 0,
        status: 'active',
        route: 'Route A',
        assignedDriverId: drivers[0]._id,
        assignedStudentIds: [students[0]._id]
      },
      {
        busNumber: 'BUS-002',
        licenseNumber: 'DEF456',
        licensePlate: 'DEF456',
        bus_id: 'BUS-002',
        model: 'Toyota Coaster',
        year: 2023,
        capacity: 40,
        currentStudentCount: 0,
        status: 'active',
        route: 'Route B',
        assignedDriverId: drivers[1]._id,
        assignedStudentIds: [students[1]._id]
      }
    ]);
    console.log('Created buses');

    // Create reports
    await Report.create([
      {
        title: 'Bus Maintenance Required',
        description: 'Engine check light is on',
        type: 'maintenance',
        priority: 'high',
        status: 'pending',
        submittedBy: students[0]._id,
        relatedBusId: buses[0]._id
      },
      {
        title: 'Late Arrival',
        description: 'Bus was 15 minutes late',
        type: 'complaint',
        priority: 'medium',
        status: 'reviewing',
        submittedBy: students[1]._id,
        relatedBusId: buses[1]._id
      }
    ]);
    console.log('Created reports');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData(); 