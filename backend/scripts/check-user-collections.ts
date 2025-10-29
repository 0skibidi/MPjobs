// Script to check all user collections in the database
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/models/User';

// Load environment variables
dotenv.config({ path: '../.env' });

async function checkUserCollections(): Promise<void> {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check all collections in the database
    console.log('\nDatabase collections:');
    const collections = mongoose.connection.db 
      ? await mongoose.connection.db.listCollections().toArray() 
      : [];
    
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check User model
    console.log('\nUser collection:');
    const userSchema = User.schema.obj;
    console.log('Schema fields:', Object.keys(userSchema));
    
    // Count documents in the User collection by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const employerCount = await User.countDocuments({ role: 'employer' });
    const jobseekerCount = await User.countDocuments({ role: 'jobseeker' });
    
    console.log('\nDocument counts:');
    console.log(`- Users (admins): ${adminCount}`);
    console.log(`- Employers: ${employerCount}`);
    console.log(`- Jobseekers: ${jobseekerCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error checking user collections:', error);
    process.exit(1);
  }
}

// Execute the function
checkUserCollections(); 