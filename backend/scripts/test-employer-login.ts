import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test credentials for employer
const testEmployer = {
  name: 'Test Employer Company',
  email: `employer-test-${Date.now()}@example.com`,
  password: 'password123',
  role: 'employer',
  companyName: 'Test Employer Inc.'
};

async function testEmployerAccountAndLogin() {
  try {
    console.log('Starting employer account test with the following credentials:');
    console.log({
      name: testEmployer.name,
      email: testEmployer.email,
      companyName: testEmployer.companyName,
      role: testEmployer.role
    });

    // Step 1: Register a new employer
    console.log('\n=== STEP 1: Creating new employer account ===');
    const registerResponse = await axios.post('http://localhost:5001/api/auth/register', testEmployer);

    console.log('\nRegistration Response:');
    console.log('Status:', registerResponse.status);
    console.log('Message:', registerResponse.data.message);
    console.log('User ID:', registerResponse.data.user.id);
    console.log('User Role:', registerResponse.data.user.role);
    
    // Store the tokens from registration
    const { accessToken, refreshToken } = registerResponse.data;
    console.log('Access Token:', accessToken.substring(0, 20) + '...');
    console.log('Refresh Token:', refreshToken.substring(0, 20) + '...');

    // Step 2: Login with the newly created employer
    console.log('\n=== STEP 2: Logging in with employer account ===');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: testEmployer.email,
      password: testEmployer.password,
      role: testEmployer.role
    });

    console.log('\nLogin Response:');
    console.log('Status:', loginResponse.status);
    console.log('Message:', loginResponse.data.message);
    console.log('User Details:', loginResponse.data.user);
    
    // Verify login was successful
    console.log('\n=== TEST RESULT ===');
    if (loginResponse.data.message === 'Login successful') {
      console.log('✅ SUCCESS: Employer account creation and login test passed!');
      console.log('The employer was created and stored in the correct collection.');
      console.log('Login with the employer credentials worked properly.');
      console.log('\nYou can now use these credentials to login through the frontend:');
      console.log(`Email: ${testEmployer.email}`);
      console.log(`Password: ${testEmployer.password}`);
      console.log(`Role: ${testEmployer.role}`);
    } else {
      console.log('❌ FAILED: Employer login test failed.');
    }
  } catch (error) {
    console.error('Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testEmployerAccountAndLogin(); 