import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/database';

// Load environment variables
dotenv.config();

// Define interfaces for type safety
interface TestUser {
  name: string;
  email: string;
  password: string;
  role: string;
  companyName?: string;
}

interface UserDocument {
  name: string;
  email: string;
  password: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  companyName?: string;
}

// Test users configuration
const testUsers: TestUser[] = [
  {
    name: 'Employer Test Account',
    email: 'employer@test.com',
    password: 'password123',
    role: 'employer',
    companyName: 'Test Company Inc.'
  },
  {
    name: 'Jobseeker Test Account',
    email: 'jobseeker@test.com',
    password: 'password123',
    role: 'jobseeker'
  },
  {
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password123',
    role: 'employer',
    companyName: 'Smith Enterprises'
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    role: 'jobseeker'
  }
];

async function createTestUsers() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Print database info
    console.log('Connected to database:', mongoose.connection.db?.databaseName);
    
    // Hash passwords and create users directly in the database
    for (const user of testUsers) {
      // Check if user already exists
      const existingUser = await mongoose.connection.collection('users').findOne({ email: user.email });
      
      if (existingUser) {
        console.log(`User with email ${user.email} already exists. Skipping...`);
        continue;
      }
      
      // Hash password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(user.password, salt);
      
      // Create user document with appropriate fields
      const userDoc: UserDocument = {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add company name if user is an employer
      if (user.role === 'employer' && user.companyName) {
        userDoc.companyName = user.companyName;
      }
      
      // Insert directly into users collection
      const result = await mongoose.connection.collection('users').insertOne(userDoc);
      
      console.log(`Created ${user.role} user: ${user.name} (${user.email}) with ID: ${result.insertedId}`);
    }
    
    // Display all created users
    console.log('\nCreated Test Users:');
    console.log('------------------------');
    
    for (const user of testUsers) {
      console.log(`${user.name} (${user.email})`);
      console.log(`Role: ${user.role}`);
      console.log(`Password: ${user.password}`);
      if (user.role === 'employer' && user.companyName) {
        console.log(`Company: ${user.companyName}`);
      }
      console.log('------------------------');
    }
    
    console.log('\nTest users created successfully!');
    console.log('You can now log in with these accounts to test different user roles.');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createTestUsers(); 