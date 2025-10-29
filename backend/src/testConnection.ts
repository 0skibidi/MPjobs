import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB!');
    console.log('Connection Details:');
    console.log(`Database Host: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Database State: ${mongoose.connection.readyState}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection(); 