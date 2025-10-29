// Script to create an admin user
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../src/models/admin.model';

// Load environment variables
dotenv.config({ path: '../.env' });

// Admin user details - you can change these as needed
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin123!',
  role: 'admin',
  emailVerified: true
};

async function createAdmin(): Promise<void> {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await Admin.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    // Create new admin user
    const admin = new Admin({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role,
      emailVerified: adminUser.emailVerified
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);
    console.log('Note: This admin user is now stored in the "admins" collection');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Execute the function
createAdmin(); 