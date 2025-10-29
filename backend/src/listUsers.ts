import { User } from './models/User';
import mongoose from 'mongoose';
import { connectDB } from './config/database';

async function listUsers() {
  try {
    console.log('Connecting to the database...');
    await connectDB();
    console.log('Connected to MongoDB via server connection method');
    
    // Print which database we're connected to
    console.log('Connected to host:', mongoose.connection.host);
    console.log('Connected to database:', mongoose.connection.db?.databaseName);
    
    if (mongoose.connection.db) {
      console.log('\nCollections in the database:');
      const collections = await mongoose.connection.db.listCollections().toArray();
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Find all admin users
    console.log('\nAdmin Users:');
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users`);
    adminUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}), Role: ${user.role}`);
    });
    
    // Count users by role
    const userCount = await User.countDocuments({ role: 'admin' });
    const employerCount = await User.countDocuments({ role: 'employer' });
    const jobseekerCount = await User.countDocuments({ role: 'jobseeker' });
    
    console.log('\nUser counts:');
    console.log(`- Users (admins): ${userCount}`);
    console.log(`- Employers: ${employerCount}`);
    console.log(`- Jobseekers: ${jobseekerCount}`);
    
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

listUsers(); 