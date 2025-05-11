import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/User.js';
import Bus from '../models/Bus.js';
import Report from '../models/Report.js';
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
  campusRoute: 'Route A',
  isOnRoute: true
};

const testReport = {
  title: 'Test Report',
  description: 'This is a test report description',
  type: 'maintenance',
  priority: 'medium',
  status: 'pending',
  submittedAt: new Date()
};

let adminToken;
let driverToken;
let studentToken;
let adminId;
let driverId;
let studentId;

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

// Clean up after each test
afterEach(async () => {
  await User.deleteMany({});
  await Bus.deleteMany({});
  await Report.deleteMany({});
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Helper function to seed test data
const seedTestData = async () => {
  // Create multiple data points for analytics
  for (let i = 0; i < 3; i++) {
    // Create buses with different statuses
    await Bus.create({
      ...testBus,
      busNumber: `BUS-${1000 + i}`,
      licensePlate: `ABC-${100 + i}`,
      status: i === 0 ? 'active' : i === 1 ? 'maintenance' : 'inactive',
      campusRoute: `Route ${String.fromCharCode(65 + i)}` // Route A, B, C
    });
    
    // Create reports with different statuses and types
    await Report.create({
      ...testReport,
      title: `Report ${i+1}`,
      type: i === 0 ? 'maintenance' : i === 1 ? 'emergency' : 'feedback',
      status: i === 0 ? 'pending' : i === 1 ? 'reviewing' : 'resolved',
      submittedBy: studentId,
      submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Different dates
      resolvedAt: i === 2 ? new Date() : undefined
    });
  }
};

describe('Admin Analytics API Operations', () => {
  beforeEach(async () => {
    // Create users
    const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
    const admin = await User.create({ 
      ...testAdmin, 
      password: hashedPassword,
      lastActive: new Date()
    });
    adminId = admin._id;
    adminToken = generateToken(admin);
    
    const driver = await User.create({ 
      ...testDriver, 
      password: await bcrypt.hash(testDriver.password, 10),
      lastActive: new Date()
    });
    driverId = driver._id;
    driverToken = generateToken(driver);
    
    const student = await User.create({
      ...testStudent,
      password: await bcrypt.hash(testStudent.password, 10),
      lastActive: new Date()
    });
    studentId = student._id;
    studentToken = generateToken(student);

    // Seed test data
    await seedTestData();
  });
  
  describe('Analytics Overview Tests', () => {
    it('should retrieve analytics overview data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      // Check for expected metrics structure
      expect(response.body.metrics.activeUsers).toBeDefined();
      expect(response.body.metrics.busesOnRoute).toBeDefined();
      expect(response.body.metrics.tripDuration).toBeDefined();
      expect(response.body.metrics.reports).toBeDefined();
    });
  });
  
  describe('Usage Analytics Tests', () => {
    it('should retrieve default usage analytics (7 days)', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/usage')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should retrieve usage analytics with custom time range', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/usage?timeRange=30d')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should include user activity data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/usage')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.userActivity).toBeDefined();
      expect(Array.isArray(response.body.userActivity)).toBe(true);
    });
  });
  
  describe('Bus Analytics Tests', () => {
    it('should retrieve bus analytics data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/buses')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.busStatusData).toBeDefined();
      expect(Array.isArray(response.body.busStatusData)).toBe(true);
      // Verify status distribution structure
      expect(response.body.busStatusData.length).toBeGreaterThan(0);
      expect(response.body.busStatusData[0]).toHaveProperty('status');
      expect(response.body.busStatusData[0]).toHaveProperty('count');
      
      // Verify route performance data
      expect(response.body.routePerformance).toBeDefined();
      expect(Array.isArray(response.body.routePerformance)).toBe(true);
    });
  });
  
  describe('Report Analytics Tests', () => {
    it('should retrieve report analytics data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify report status distribution
      expect(response.body.reportStatusData).toBeDefined();
      expect(Array.isArray(response.body.reportStatusData)).toBe(true);
      
      // Verify report types distribution
      expect(response.body.reportTypesData).toBeDefined();
      expect(Array.isArray(response.body.reportTypesData)).toBe(true);
      
      // Verify resolution times
      expect(response.body.resolutionTimes).toBeDefined();
      expect(Array.isArray(response.body.resolutionTimes)).toBe(true);
    });
  });
  
  describe('Engagement Analytics Tests', () => {
    it('should retrieve engagement analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/engagement')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify top routes data
      expect(response.body.topRoutes).toBeDefined();
      expect(Array.isArray(response.body.topRoutes)).toBe(true);
      
      // Verify user engagement data
      expect(response.body.userEngagement).toBeDefined();
      expect(Array.isArray(response.body.userEngagement)).toBe(true);
      expect(response.body.userEngagement.length).toBeGreaterThan(0);
    });
  });
  
  describe('Analytics Export Tests', () => {
    it('should export analytics data as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.header['content-disposition']).toContain('attachment; filename=bus-tracking-analytics-');
      expect(response.text).toBeDefined();
      // Check CSV content contains expected headers
      expect(response.text).toContain('Bus Tracking Analytics Report');
      expect(response.text).toContain('BUS STATUS DATA');
      expect(response.text).toContain('REPORT STATUS DATA');
      expect(response.text).toContain('REPORT TYPES DATA');
    });
    
    it('should support custom time range for export', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export?timeRange=30d')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.text).toContain('Time range: 30d');
    });
  });
  
  describe('Authorization for Analytics Operations', () => {
    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should not allow non-admin users to access admin analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied. You do not have permission to perform this action.');
    });
  });
}); 