// Script to recreate admin user using the server's connection method
import bcrypt from 'bcryptjs';
import { User } from '../src/models/user.model';
import { connectDB } from '../src/config/database';

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin123!',
  role: 'admin',
  emailVerified: true
};

async function recreateAdmin() {
  try {
    console.log('Connecting to database using server connection method...');
    await connectDB();
    console.log('Connected to database');

    // Delete existing admin if it exists
    console.log('Deleting any existing admin users...');
    const deleteResult = await User.deleteOne({ email: adminUser.email });
    console.log(`Deleted ${deleteResult.deletedCount} admin users`);

    // Create new admin user
    console.log('Creating new admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    const admin = new User({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role,
      emailVerified: adminUser.emailVerified
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);

    // Verify admin exists
    const adminCheck = await User.findOne({ role: 'admin' });
    if (adminCheck) {
      console.log('Verification: Admin user found in database.');
    } else {
      console.log('Verification failed: Admin user not found in database.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Execute the function
recreateAdmin(); 