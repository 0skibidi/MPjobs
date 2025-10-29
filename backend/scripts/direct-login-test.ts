import axios from 'axios';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
// Also import the original bcrypt to try both
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { User } from '../src/models/User';

// Load environment variables
dotenv.config();

// Test credentials
const testEmail = 'test-login-fix2@example.com';
const testPassword = 'password123';

async function testDirectLogin() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');

    // Delete existing test user if it exists
    await User.deleteOne({ email: testEmail });
    console.log('Deleted any existing test user');

    // Create a test user with direct DB insert to bypass pre-save hooks
    console.log('Creating test user...');
    
    // Hash password with bcryptjs
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(testPassword, salt);
    console.log('Password hashed with bcryptjs:', hashedPassword);
    
    // Insert directly using mongoose to bypass the schema pre-save hook
    const result = await mongoose.connection.collection('users').insertOne({
      name: 'Test Login User 2',
      email: testEmail,
      password: hashedPassword,
      role: 'jobseeker',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Test user created with _id:', result.insertedId);
    
    // Retrieve the saved user
    const savedUser = await User.findOne({ email: testEmail });
    console.log('User retrieved from database');
    
    // Get the stored password
    console.log('Stored password hash:', savedUser.password);
    // Check first characters of hash to identify the hash format
    console.log('Hash format:', savedUser.password.substring(0, 4));
    
    // Test with bcryptjs
    console.log('Testing with bcryptjs:');
    const bcryptjsMatch = await bcryptjs.compare(testPassword, savedUser.password);
    console.log('bcryptjs comparison result:', bcryptjsMatch);

    // Test with bcrypt
    console.log('Testing with bcrypt:');
    const bcryptMatch = await bcrypt.compare(testPassword, savedUser.password);
    console.log('bcrypt comparison result:', bcryptMatch);
    
    // Test the model's comparePassword method
    console.log('Testing model comparePassword method:');
    const modelMatch = await savedUser.comparePassword(testPassword);
    console.log('Model comparePassword result:', modelMatch);

    // Test the login API
    console.log('\nTesting login API...');
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: testEmail,
      password: testPassword,
      role: 'jobseeker'
    });

    console.log('Login API response:', response.data);
    console.log('Login successful!');
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

// Run the test
testDirectLogin(); 