import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/User.js';
import Bus from '../models/Bus.js';
import bcrypt from 'bcryptjs';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/bus-tracking-test';
process.env.JWT_SECRET = 'test-secret-key';

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Test data
const testAdmin = {
  name: 'Test Admin',
  email: 'testadmin@example.com',
  password: 'test123',
  role: 'admin',
  phone: '1234567890',
  isActive: true
};

const testDriver = {
  name: 'Test Driver',
  email: 'testdriver@example.com',
  password: 'test123',
  role: 'driver',
  phone: '5555555555',
  isActive: true
};

const testStudent = {
  name: 'Test Student',
  email: 'teststudent@example.com',
  password: 'test123',
  role: 'student',
  phone: '0987654321',
  isActive: true
};

const testBus = {
  busNumber: 'BUS-1234',
  licensePlate: 'ABC-123',
  capacity: 40,
  status: 'active',
  model: 'Test Model',
  year: 2023,
  fuelType: 'diesel',
  isAccessible: true,
  hasWifi: true,
  hasUSBCharging: true,
  campusRoute: 'Route A'
};

let adminToken;
let driverToken;
let adminId;
let driverId;
let studentId;
let busId;

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

// Clean up after each test
afterEach(async () => {
  await User.deleteMany({});
  await Bus.deleteMany({});
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Admin Bus API Operations', () => {
  beforeEach(async () => {
    // Create admin user and get token
    const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
    const admin = await User.create({ ...testAdmin, password: hashedPassword });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create driver user
    const driver = await User.create({ 
      ...testDriver, 
      password: await bcrypt.hash(testDriver.password, 10) 
    });
    driverId = driver._id;
    driverToken = generateToken(driver);

    // Create student user
    const student = await User.create({
      ...testStudent,
      password: await bcrypt.hash(testStudent.password, 10)
    });
    studentId = student._id;
  });

  describe('Bus Creation and Retrieval', () => {
    it('should create a new bus', async () => {
      const response = await request(app)
        .post('/api/admin/bus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testBus);

      expect(response.status).toBe(201);
      expect(response.body.bus).toBeDefined();
      expect(response.body.bus.busNumber).toBe(testBus.busNumber);
      expect(response.body.bus.licensePlate).toBe(testBus.licensePlate);
      busId = response.body.bus._id;
    });

    it('should not create a bus with missing required fields', async () => {
      const incompleteBus = {
        busNumber: 'BUS-5678'
        // Missing other required fields
      };

      const response = await request(app)
        .post('/api/admin/bus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteBus);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should retrieve all buses', async () => {
      // First create a bus
      const bus = await Bus.create(testBus);
      busId = bus._id;

      const response = await request(app)
        .get('/api/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.buses)).toBe(true);
      expect(response.body.buses.length).toBe(1);
      expect(response.body.buses[0].busNumber).toBe(testBus.busNumber);
    });

    it('should retrieve a bus by ID', async () => {
      // First create a bus
      const bus = await Bus.create(testBus);
      busId = bus._id;

      const response = await request(app)
        .get(`/api/admin/bus/${busId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.bus).toBeDefined();
      expect(response.body.bus._id).toBe(busId.toString());
      expect(response.body.bus.busNumber).toBe(testBus.busNumber);
    });

    it('should handle invalid bus ID when retrieving', async () => {
      const response = await request(app)
        .get('/api/admin/bus/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Bus Update and Deletion', () => {
    beforeEach(async () => {
      // Create a test bus
      const bus = await Bus.create(testBus);
      busId = bus._id;
    });

    it('should update a bus', async () => {
      const updates = {
        status: 'maintenance',
        notes: 'Scheduled maintenance'
      };

      const response = await request(app)
        .put(`/api/admin/bus/${busId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.bus).toBeDefined();
      expect(response.body.bus.status).toBe(updates.status);
      expect(response.body.bus.notes).toBe(updates.notes);
    });

    it('should delete a bus', async () => {
      const response = await request(app)
        .delete(`/api/admin/bus/${busId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bus deleted successfully');

      // Verify bus is deleted
      const deletedBus = await Bus.findById(busId);
      expect(deletedBus).toBeNull();
    });

    it('should handle deletion of non-existent bus', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/admin/bus/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Bus not found');
    });
  });

  describe('Driver Assignment', () => {
    beforeEach(async () => {
      // Create a test bus
      const bus = await Bus.create(testBus);
      busId = bus._id;
    });

    it('should assign a driver to a bus', async () => {
      const response = await request(app)
        .post('/api/admin/bus/assign-driver')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId, driverId });

      expect(response.status).toBe(200);
      expect(response.body.bus).toBeDefined();
      expect(response.body.bus.driver_id).toBeDefined();
      expect(response.body.bus.driver_id.name).toBe(testDriver.name);

      // Verify driver is updated with assigned bus
      const updatedDriver = await User.findById(driverId);
      expect(updatedDriver.assignedBusId.toString()).toBe(busId.toString());
    });

    it('should handle invalid bus ID when assigning driver', async () => {
      const response = await request(app)
        .post('/api/admin/bus/assign-driver')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId: 'invalid-id', driverId });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid driver ID when assigning driver', async () => {
      const response = await request(app)
        .post('/api/admin/bus/assign-driver')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId, driverId: 'invalid-id' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should not assign non-driver user to bus', async () => {
      const response = await request(app)
        .post('/api/admin/bus/assign-driver')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId, driverId: studentId });

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Authorization for Bus Operations', () => {
    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/admin/buses');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/buses')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should not allow non-admin users to access admin bus routes', async () => {
      const response = await request(app)
        .get('/api/admin/buses')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied. You do not have permission to perform this action.');
    });
  });
}); 