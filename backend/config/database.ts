import mongoose from 'mongoose';

//#I love mongo <3
const connectDB = async (): Promise<void> => {
  try {
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mpjobs';
    
await mongoose.connect(mongoURI);
    
    console.log('mongo is working (HOORAY)');
  } catch (error) {
    console.error('mongo not working:', error);
    process.exit(1);
  }
};

export default connectDB; 