import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test credentials for jobseeker account
const testCredentials = {
  name: "Test Jobseeker User",
  email: `jobseeker-test-${Date.now()}@example.com`,
  password: "password123",
  role: "jobseeker",
  skills: ["JavaScript", "React", "Node.js"],
  experience: "2 years",
  education: "Bachelor's in Computer Science"
};

async function testJobseekerAccountAndLogin() {
  console.log("Starting jobseeker account and login test");
  console.log("Test credentials:", {
    name: testCredentials.name,
    email: testCredentials.email,
    password: testCredentials.password,
    role: testCredentials.role,
    skills: testCredentials.skills,
    experience: testCredentials.experience,
    education: testCredentials.education
  });

  try {
    console.log("\n--- Step 1: Creating new jobseeker account ---");
    // Register a new jobseeker account
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

    // Store tokens for potential future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const accessToken = registerResponse.data.accessToken;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const refreshToken = registerResponse.data.refreshToken;

    console.log("\n--- Step 2: Logging in with jobseeker account ---");
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
      console.log("✅ Jobseeker account creation and login test PASSED");
      console.log("Credentials for frontend use:");
      console.log(`Email: ${testCredentials.email}`);
      console.log(`Password: ${testCredentials.password}`);
      console.log(`Role: ${testCredentials.role}`);
    } else {
      console.log("❌ Jobseeker account creation and login test FAILED");
    }
  } catch (error) {
    console.error("\n--- Test Error ---");
    console.error("❌ Jobseeker account creation and login test FAILED");
    if (axios.isAxiosError(error)) {
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

// Run the test
testJobseekerAccountAndLogin(); 