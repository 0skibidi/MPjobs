// Script to test admin login directly
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/user.model';

// Load environment variables
dotenv.config({ path: '../.env' });

async function testAdminLogin(): Promise<void> {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Login data
    const loginData = {
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin'
    };

    console.log('Testing login for:', loginData);

    // Find user in appropriate collection based on role
    console.log(`Searching for user with role: ${loginData.role}`);
    
    let user;
    if (loginData.role === 'admin') {
      user = await User.findOne({ email: loginData.email, role: 'admin' });
    }

    if (!user) {
      console.log('User not found');
      await mongoose.disconnect();
      return;
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Verify password
    console.log('Verifying password...');
    const isMatch = await bcrypt.compare(loginData.password, user.password);
    console.log('Password match:', isMatch);

    if (isMatch) {
      console.log('Login would be successful!');
    } else {
      console.log('Login would fail due to password mismatch');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

// Execute the function
testAdminLogin(); 