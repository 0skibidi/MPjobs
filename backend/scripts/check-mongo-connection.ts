// Script to check MongoDB connection details
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from different paths to check for differences
console.log('Checking environment variables...');
console.log('Current working directory:', process.cwd());

// Try loading from backend/.env
dotenv.config();
console.log('1. Loading from backend/.env');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Try loading from .env at root
dotenv.config({ path: '../.env' });
console.log('2. Loading from ../.env');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Check which database scripts are connecting to
async function checkScriptConnection(): Promise<void> {
  try {
    console.log('\nAttempting to connect to MongoDB from script...');
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    console.log('Using connection string:', MONGO_URI);
    
    await mongoose.connect(MONGO_URI);
    
    console.log('Script connected to MongoDB successfully');
    console.log('Connected to host:', mongoose.connection.host);
    console.log('Connected to database:', mongoose.connection.db?.databaseName);
    
    // Check user collections
    if (mongoose.connection.db) {
      console.log('\nCollections in database:');
      const collections = await mongoose.connection.db.listCollections().toArray();
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Execute the function
checkScriptConnection(); 