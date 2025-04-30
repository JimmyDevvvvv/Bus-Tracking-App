import request from 'supertest';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/User.js';
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

const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'test123',
  role: 'student',
  phone: '1112223333',
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

let adminToken;
let studentToken;
let userId;

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

// Clean up after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Admin User CRUD Operations', () => {
  beforeEach(async () => {
    // Create admin user and get token
    const admin = await User.create(testAdmin);
    adminToken = generateToken(admin);

    // Create student user and get token for authorization tests
    const student = await User.create(testStudent);
    studentToken = generateToken(student);
  });

  describe('Authorization', () => {
    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should not allow non-admin users to access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied. You do not have permission to perform this action.');
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testUser);

      console.log('Create user response:', response.body);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.email).toBe(testUser.email);
      userId = response.body.user._id;
    });

    it('should not create user with existing email', async () => {
      await User.create(testUser);
      
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });

    it('should create users with different roles', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testDriver);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('driver');
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create additional test users
      await User.create(testDriver);
      await User.create({...testUser, email: 'inactive@example.com', isActive: false});
    });

    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBe(4); // admin, student, driver, inactive user
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=driver')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].role).toBe('driver');
    });

    it('should filter users by active status', async () => {
      const response = await request(app)
        .get('/api/admin/users?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].isActive).toBe(false);
    });

    it('should search users by name or email', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=driver')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].email).toBe('testdriver@example.com');
    });

    it('should get user by ID', async () => {
      const user = await User.create(testUser);
      
      const response = await request(app)
        .get(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user._id).toBe(user._id.toString());
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should handle invalid user ID', async () => {
      const response = await request(app)
        .get('/api/admin/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user ID');
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user details', async () => {
      const user = await User.create(testUser);
      const updatedData = {
        name: 'Updated Name',
        phone: '1112223333'
      };

      const response = await request(app)
        .put(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.name).toBe(updatedData.name);
      expect(response.body.user.phone).toBe(updatedData.phone);
    });

    it('should update user password', async () => {
      const user = await User.create(testUser);
      const newPassword = 'newpassword123';

      const response = await request(app)
        .put(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: newPassword });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User updated successfully');

      // Verify new password works
      const updatedUser = await User.findById(user._id);
      const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isMatch).toBe(true);
    });

    it('should update user active status', async () => {
      const user = await User.create(testUser);

      const response = await request(app)
        .put(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.user.isActive).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user', async () => {
      const user = await User.create(testUser);

      const response = await request(app)
        .delete(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should handle deletion of non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });
}); 