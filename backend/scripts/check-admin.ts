// Script to check admin user details
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Admin } from '../src/models/admin.model';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '../.env' });

async function checkAdmin(): Promise<void> {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await Admin.findOne({ role: 'admin' });
    if (admin) {
      console.log('Admin user found:');
      console.log('ID:', admin._id);
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Email Verified:', admin.emailVerified);
      console.log('Created At:', admin.createdAt);
      
      // Test password verification with the default password from create-admin.ts
      const password = 'Admin123!';
      const isMatch = await bcrypt.compare(password, admin.password);
      console.log('Password matches "Admin123!":', isMatch);

      // Try verifying with alternative passwords in case it was changed
      const alternativePasswords = ['admin', 'password', 'admin123', 'Admin123'];
      for (const altPassword of alternativePasswords) {
        const altMatch = await bcrypt.compare(altPassword, admin.password);
        if (altMatch) {
          console.log(`Password matches "${altPassword}": true`);
        }
      }
    } else {
      console.log('No admin user found');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking admin:', error);
    process.exit(1);
  }
}

// Execute the function
checkAdmin(); 