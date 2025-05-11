import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/User.js';
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

const testStudent = {
  name: 'Test Student',
  email: 'teststudent@example.com',
  password: 'test123',
  role: 'student',
  phone: '0987654321',
  isActive: true
};

const testReport = {
  title: 'Test Report',
  description: 'This is a test report description',
  type: 'maintenance',
  priority: 'medium',
  status: 'pending'
};

let adminToken;
let studentToken;
let adminId;
let studentId;
let reportId;

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

// Clean up after each test
afterEach(async () => {
  await User.deleteMany({});
  await Report.deleteMany({});
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Admin Report API Operations', () => {
  beforeEach(async () => {
    // Create admin user and get token
    const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
    const admin = await User.create({ ...testAdmin, password: hashedPassword });
    adminId = admin._id;
    adminToken = generateToken(admin);

    // Create student user
    const student = await User.create({
      ...testStudent,
      password: await bcrypt.hash(testStudent.password, 10)
    });
    studentId = student._id;
    studentToken = generateToken(student);
    
    // Create a test report
    const report = await Report.create({
      ...testReport,
      submittedBy: studentId,
      submittedAt: new Date()
    });
    reportId = report._id;
  });
  
  describe('Report Retrieval', () => {
    it('should retrieve all reports', async () => {
      // Create another report for testing multiple reports
      await Report.create({
        title: 'Second Report',
        description: 'Another test report',
        type: 'feedback',
        priority: 'low',
        status: 'pending',
        submittedBy: studentId,
        submittedAt: new Date()
      });
      
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.reports.length).toBe(2);
      expect(response.body.count).toBe(2);
    });

    it('should filter reports by status', async () => {
      // Create another report with different status
      await Report.create({
        title: 'Resolved Report',
        description: 'A resolved test report',
        type: 'maintenance',
        priority: 'high',
        status: 'resolved',
        submittedBy: studentId,
        submittedAt: new Date(),
        resolvedAt: new Date()
      });
      
      const response = await request(app)
        .get('/api/admin/reports?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reports.length).toBe(1);
      expect(response.body.reports[0].status).toBe('pending');
    });
    
    it('should filter reports by type', async () => {
      // Create another report with different type
      await Report.create({
        title: 'Emergency Report',
        description: 'An emergency test report',
        type: 'emergency',
        priority: 'high',
        status: 'pending',
        submittedBy: studentId,
        submittedAt: new Date()
      });
      
      const response = await request(app)
        .get('/api/admin/reports?type=maintenance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reports.length).toBe(1);
      expect(response.body.reports[0].type).toBe('maintenance');
    });
    
    it('should retrieve a report by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
      expect(response.body.report._id).toBe(reportId.toString());
      expect(response.body.report.title).toBe(testReport.title);
    });

    it('should handle invalid report ID', async () => {
      const response = await request(app)
        .get('/api/admin/reports/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500); // Assuming the server returns 500 for invalid IDs
    });
  });

  describe('Report Update Operations', () => {
    it('should update report status', async () => {
      const updates = {
        status: 'reviewing'
      };

      const response = await request(app)
        .put(`/api/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report.status).toBe(updates.status);
    });
    
    it('should automatically set resolvedAt when resolving a report', async () => {
      const updates = {
        status: 'resolved'
      };
      
      const before = new Date();
      
      const response = await request(app)
        .put(`/api/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      const after = new Date();
      
      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('resolved');
      expect(response.body.report.resolvedAt).toBeDefined();
      
      // Verify the resolvedAt is between before and after timestamps
      const resolvedAt = new Date(response.body.report.resolvedAt);
      expect(resolvedAt >= before && resolvedAt <= after).toBe(true);
    });
  });
  
  describe('Report Comments', () => {
    it('should add a comment to a report', async () => {
      const commentData = {
        comment: 'This is a test comment',
        isInternal: true
      };
      
      const response = await request(app)
        .post(`/api/admin/reports/${reportId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(commentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.comment).toBe(commentData.comment);
      expect(response.body.comment.isInternal).toBe(commentData.isInternal);
    });
    
    it('should not add empty comments', async () => {
      const commentData = {
        comment: '',
        isInternal: true
      };
      
      const response = await request(app)
        .post(`/api/admin/reports/${reportId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Comment text is required');
    });
  });
  
  describe('Report Assignment', () => {
    it('should assign a report to an admin', async () => {
      const assignmentData = {
        adminId: adminId
      };
      
      const response = await request(app)
        .post(`/api/admin/reports/${reportId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.assignedTo._id).toBe(adminId.toString());
      expect(response.body.report.status).toBe('reviewing'); // Status should be updated to reviewing
    });
    
    it('should handle missing admin ID', async () => {
      const response = await request(app)
        .post(`/api/admin/reports/${reportId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin ID is required');
    });
    
    it('should not assign to non-admin users', async () => {
      const assignmentData = {
        adminId: studentId
      };
      
      const response = await request(app)
        .post(`/api/admin/reports/${reportId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin not found');
    });
  });
  
  describe('Authorization for Report Operations', () => {
    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/admin/reports');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should not allow non-admin users to access admin report routes', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied. You do not have permission to perform this action.');
    });
  });
}); 