import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/database';

// Load environment variables
dotenv.config();

async function deleteUsersCollection() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Print database info
    console.log('Connected to database:', mongoose.connection.db?.databaseName);
    
    // Check if users collection exists before trying to drop it
    const collections = await mongoose.connection.db?.listCollections().toArray();
    const usersCollectionExists = collections?.some(coll => coll.name === 'users');
    
    if (usersCollectionExists) {
      console.log('\nFound users collection, preparing to delete...');
      
      // Count how many users are in the collection before deleting
      const count = await mongoose.connection.collection('users').countDocuments({});
      console.log(`The users collection contains ${count} documents that will be deleted.`);
      
      // Drop the users collection
      const result = await mongoose.connection.db?.dropCollection('users');
      
      if (result) {
        console.log('\nSUCCESS: The users collection has been deleted.');
        console.log('Now the system should use the separate employers, jobseekers, and admins collections.');
      } else {
        console.log('\nWARNING: Something went wrong when trying to delete the collection.');
      }
    } else {
      console.log('\nNo users collection found. Nothing to delete.');
    }
    
    // List remaining collections to confirm
    console.log('\nRemaining collections in the database:');
    const remainingCollections = await mongoose.connection.db?.listCollections().toArray();
    remainingCollections?.forEach(coll => {
      console.log(`- ${coll.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Request confirmation before running
console.log('WARNING: This script will permanently delete the users collection from your database.');
console.log('This action cannot be undone. Any users stored only in this collection will be lost.');
console.log('If you are sure you want to proceed, run this script with the --confirm flag.');

// Check for confirmation flag
if (process.argv.includes('--confirm')) {
  console.log('Confirmation received. Proceeding with deletion...');
  deleteUsersCollection();
} else {
  console.log('\nOperation canceled. To proceed, run the script with --confirm:');
  console.log('npx ts-node scripts/delete-users-collection.ts --confirm');
  process.exit(0);
} 