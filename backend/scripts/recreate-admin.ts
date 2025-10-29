// Script to recreate the admin user
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/user.model';

// Load environment variables
dotenv.config({ path: '../.env' });

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin123!',
  role: 'admin',
  emailVerified: true
};

async function recreateAdmin(): Promise<void> {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin
    console.log('Deleting existing admin user...');
    const result = await User.deleteOne({ email: adminUser.email });
    console.log(`Deleted ${result.deletedCount} user(s)`);

    // Hash password
    console.log('Creating new admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    // Create new admin user
    const admin = new User({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role,
      emailVerified: adminUser.emailVerified
    });

    await admin.save();
    console.log('Admin user recreated successfully');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error recreating admin user:', error);
    process.exit(1);
  }
}

// Execute the function
recreateAdmin(); 