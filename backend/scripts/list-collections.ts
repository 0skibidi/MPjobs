import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/database';

// Load environment variables
dotenv.config();

async function listCollections() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Print database info
    const dbName = mongoose.connection.db?.databaseName;
    console.log('Connected to database:', dbName);
    
    // List all collections in the database
    console.log('\nCollections in the database:');
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    if (collections && collections.length > 0) {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('No collections found in the database.');
    }
    
    // Also try to check if there are other databases with users
    console.log('\nChecking for specific user collections:');
    
    // Try to count documents in possible user collections
    const usersCount = await mongoose.connection.collection('users').countDocuments({});
    console.log(`- users collection: ${usersCount} documents`);
    
    try {
      const employersCount = await mongoose.connection.collection('employers').countDocuments({});
      console.log(`- employers collection: ${employersCount} documents`);
    } catch (error) {
      console.log('- employers collection: not found');
    }
    
    try {
      const jobseekersCount = await mongoose.connection.collection('jobseekers').countDocuments({});
      console.log(`- jobseekers collection: ${jobseekersCount} documents`);
    } catch (error) {
      console.log('- jobseekers collection: not found');
    }
    
    try {
      const adminsCount = await mongoose.connection.collection('admins').countDocuments({});
      console.log(`- admins collection: ${adminsCount} documents`);
    } catch (error) {
      console.log('- admins collection: not found');
    }
    
  } catch (error) {
    console.error('Error listing collections:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
listCollections(); 