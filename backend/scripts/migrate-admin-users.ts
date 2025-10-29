import { connectDB } from '../src/config/database';
import { User } from '../src/models/user.model';
import { Admin } from '../src/models/admin.model';

async function migrateAdminUsers() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database successfully');
    
    // Find all users with role 'admin'
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users to migrate`);
    
    if (adminUsers.length === 0) {
      console.log('No admin users to migrate');
      process.exit(0);
    }
    
    // Migrate each admin user
    let migratedCount = 0;
    for (const adminUser of adminUsers) {
      console.log(`Migrating admin: ${adminUser.email}`);
      
      // Check if this admin already exists in the new collection
      const existingAdmin = await Admin.findOne({ email: adminUser.email });
      if (existingAdmin) {
        console.log(`Admin user ${adminUser.email} already exists in the admins collection, skipping`);
        continue;
      }
      
      // Create new admin document
      const admin = new Admin({
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password, // Password is already hashed
        role: 'admin',
        emailVerified: adminUser.emailVerified || true,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt
      });
      
      await admin.save();
      console.log(`Migrated admin user: ${admin.email}`);
      migratedCount++;
    }
    
    console.log(`Successfully migrated ${migratedCount} admin users`);
    
    // Ask if we should delete the original admin users
    console.log('\nWould you like to remove the admin users from the users collection? (yes/no)');
    process.stdin.once('data', async (data) => {
      const response = data.toString().trim().toLowerCase();
      
      if (response === 'yes' || response === 'y') {
        const deleteResult = await User.deleteMany({ role: 'admin' });
        console.log(`Deleted ${deleteResult.deletedCount} admin users from the users collection`);
      } else {
        console.log('Keeping original admin users in the users collection');
      }
      
      console.log('Migration complete');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error migrating admin users:', error);
    process.exit(1);
  }
}

migrateAdminUsers(); 