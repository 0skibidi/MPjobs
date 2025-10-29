// Script to test the login API endpoint
import axios from 'axios';

async function testApiLogin() {
  try {
    console.log('Testing API login for admin user...');
    
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin'
    });
    
    console.log('Login successful!');
    console.log('Response status:', response.status);
    console.log('User data:', response.data.user);
    console.log('Access token exists:', !!response.data.accessToken);
    console.log('Refresh token exists:', !!response.data.refreshToken);
  } catch (error: any) {
    console.error('Login failed!');
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.response?.data?.message || error.message);
    
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Execute the function
testApiLogin(); 