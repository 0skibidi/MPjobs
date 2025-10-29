// Script to list all users in the database
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/models/User';

// Load environment variables
dotenv.config({ path: '../.env' });

async function listUsers(): Promise<void> {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // List all collections (safely)
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Collections in database:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('Could not access database collections');
    }
    
    // Find admin users
    console.log('\nLooking for admin users in the "users" collection...');
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}), Role: ${user.role}`);
    });

    // Find employers
    console.log('\nEmployers in the database:');
    const employers = await User.find({ role: 'employer' });
    console.log(`Found ${employers.length} employers:`);
    employers.forEach(employer => {
      console.log(`- ${employer.name} (${employer.email})`);
    });

    // Find jobseekers
    console.log('\nJob Seekers in the database:');
    const jobseekers = await User.find({ role: 'jobseeker' });
    console.log(`Found ${jobseekers.length} job seekers:`);
    jobseekers.forEach(jobseeker => {
      console.log(`- ${jobseeker.name} (${jobseeker.email})`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

// Execute the function
listUsers(); 