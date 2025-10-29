import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test credentials
const testEmail = `test-register-login-${Date.now()}@example.com`;
const testPassword = 'testPassword123';
const testName = 'Test Register Login User';

async function testRegisterAndLogin() {
  try {
    console.log('Starting test for register and login with user:', {
      email: testEmail,
      password: testPassword,
      name: testName
    });

    // Step 1: Register a new user
    console.log('\nStep 1: Registering new user...');
    const registerResponse = await axios.post('http://localhost:5001/api/auth/register', {
      name: testName,
      email: testEmail,
      password: testPassword,
      role: 'jobseeker'
    });

    console.log('Register response:', registerResponse.data);

    // Step 2: Login with the newly created user
    console.log('\nStep 2: Attempting login with newly created user...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: testEmail,
      password: testPassword,
      role: 'jobseeker'
    });

    console.log('Login response:', loginResponse.data);
    console.log('\nTest completed successfully! User can register and login with the same password.');
  } catch (error) {
    console.error('Test error:', error.response?.data || error.message);
  }
}

// Run the test
testRegisterAndLogin(); 