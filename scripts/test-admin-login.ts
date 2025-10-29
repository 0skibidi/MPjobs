import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test credentials for admin account
const testCredentials = {
  name: "Test Admin User",
  email: `admin-test-${Date.now()}@example.com`,
  password: "password123",
  role: "admin"
};

async function testAdminAccountAndLogin() {
  console.log("Starting admin account and login test");
  console.log("Test credentials:", {
    name: testCredentials.name,
    email: testCredentials.email,
    password: testCredentials.password,
    role: testCredentials.role
  });

  try {
    console.log("\n--- Step 1: Creating new admin account ---");
    // Register a new admin account
    const registerResponse = await axios.post(
      'http://localhost:5001/api/auth/register',
      testCredentials
    );

    console.log("Registration response:", {
      status: registerResponse.status,
      message: registerResponse.data.message,
      userId: registerResponse.data.user?._id,
      role: registerResponse.data.user?.role
    });

    console.log("\n--- Step 2: Logging in with admin account ---");
    // Login with the newly created account
    const loginResponse = await axios.post(
      'http://localhost:5001/api/auth/login',
      {
        email: testCredentials.email,
        password: testCredentials.password,
        role: testCredentials.role
      }
    );

    console.log("Login response:", {
      status: loginResponse.status,
      message: loginResponse.data.message,
      user: {
        id: loginResponse.data.user?._id,
        name: loginResponse.data.user?.name,
        email: loginResponse.data.user?.email,
        role: loginResponse.data.user?.role
      }
    });

    console.log("\n--- Test Result ---");
    if (loginResponse.status === 200 && loginResponse.data.user) {
      console.log("✅ Admin account creation and login test PASSED");
      console.log("Credentials for frontend use:");
      console.log(`Email: ${testCredentials.email}`);
      console.log(`Password: ${testCredentials.password}`);
      console.log(`Role: ${testCredentials.role}`);
    } else {
      console.log("❌ Admin account creation and login test FAILED");
    }
  } catch (error) {
    console.error("\n--- Test Error ---");
    console.error("❌ Admin account creation and login test FAILED");
    if (axios.isAxiosError(error)) {
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

// Run the test
testAdminAccountAndLogin(); 