import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/database';

// Load environment variables
dotenv.config();

async function listAllUsers() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Print database info
    console.log('Connected to database:', mongoose.connection.db?.databaseName);
    
    // Get all users from the database
    const users = await mongoose.connection.collection('users').find({}).toArray();
    
    // Count users by role
    const employerCount = users.filter(user => user.role === 'employer').length;
    const jobseekerCount = users.filter(user => user.role === 'jobseeker').length;
    const adminCount = users.filter(user => user.role === 'admin').length;
    const otherCount = users.filter(user => !['employer', 'jobseeker', 'admin'].includes(user.role)).length;
    
    // Print summary
    console.log('\nUser Summary:');
    console.log(`Total Users: ${users.length}`);
    console.log(`- Employers: ${employerCount}`);
    console.log(`- Jobseekers: ${jobseekerCount}`);
    console.log(`- Admins: ${adminCount}`);
    if (otherCount > 0) {
      console.log(`- Other/Unknown roles: ${otherCount}`);
    }
    
    // Print employer users
    console.log('\nEmployer Users:');
    console.log('------------------------');
    users
      .filter(user => user.role === 'employer')
      .forEach(user => {
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Company: ${user.companyName || 'Not specified'}`);
        console.log(`User ID: ${user._id}`);
        console.log('------------------------');
      });
    
    // Print jobseeker users
    console.log('\nJobseeker Users:');
    console.log('------------------------');
    users
      .filter(user => user.role === 'jobseeker')
      .forEach(user => {
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`User ID: ${user._id}`);
        console.log('------------------------');
      });
    
    // Print admin users if any
    if (adminCount > 0) {
      console.log('\nAdmin Users:');
      console.log('------------------------');
      users
        .filter(user => user.role === 'admin')
        .forEach(user => {
          console.log(`Name: ${user.name}`);
          console.log(`Email: ${user.email}`);
          console.log(`User ID: ${user._id}`);
          console.log('------------------------');
        });
    }
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
listAllUsers(); 