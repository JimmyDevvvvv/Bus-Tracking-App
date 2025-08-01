import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load test environment variables
process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

// Connect to test database
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

// Clean up database after each test
afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
}); 