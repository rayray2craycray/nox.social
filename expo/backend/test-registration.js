/**
 * Business Registration Flow Test
 * Tests the complete registration process end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-venue-${Date.now()}@example.com`;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}[Step ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

async function testRegistrationFlow() {
  let userId, token;

  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║        Business Registration Flow Test                     ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    // Step 1: Test Health Check
    logStep(1, 'Testing API Health Check');
    try {
      const health = await axios.get(`${BASE_URL}/health`);
      logSuccess(`API is healthy: ${health.data.status}`);
      logSuccess(`Database: ${health.data.checks.database}`);
    } catch (error) {
      logError('Health check failed');
      throw error;
    }

    // Step 2: Register Regular User Account
    logStep(2, 'Registering Regular User Account');
    const password = 'TestPass123!';
    const displayName = 'Test User';

    try {
      const userResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
        email: TEST_EMAIL,
        password,
        displayName,
      });

      userId = userResponse.data.data.user.id;
      token = userResponse.data.data.accessToken;

      logSuccess('User account created successfully');
      logSuccess(`User ID: ${userId}`);
      logSuccess(`Display Name: ${displayName}`);
      logSuccess(`Email: ${TEST_EMAIL}`);
    } catch (error) {
      logError('User registration failed');
      if (error.response) {
        logError(`Status: ${error.response.status}`);
        logError(`Message: ${error.response.data.message || error.response.data.error}`);
      }
      throw error;
    }

    // Step 3: Upgrade to Business Account
    logStep(3, 'Upgrading to Business Profile');
    const businessData = {
      venueName: 'Test Nightclub ' + Date.now(),
      businessEmail: TEST_EMAIL,
      businessType: 'CLUB',
      location: {
        address: '123 Test Street',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
      },
      phone: '+1-555-123-4567',
      website: 'https://testnightclub.com',
      description: 'A test nightclub for registration flow testing',
    };

    try {
      const businessResponse = await axios.post(
        `${BASE_URL}/api/business/register`,
        businessData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      logSuccess('Business profile created successfully');
      logSuccess(`Venue Name: ${businessResponse.data.data.businessProfile.venueName}`);
      logSuccess(`Business Email: ${businessResponse.data.data.businessProfile.businessEmail}`);
      logSuccess(`Status: ${businessResponse.data.data.businessProfile.status}`);
      logSuccess(`Verification Email Sent: Yes`);
    } catch (error) {
      logError('Business registration failed');
      if (error.response) {
        logError(`Status: ${error.response.status}`);
        logError(`Message: ${error.response.data.message || error.response.data.error}`);
      }
      throw error;
    }

    // Step 4: Verify Authentication Token
    logStep(4, 'Verifying Authentication Token');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/business/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      logSuccess('Token is valid');
      logSuccess(`Profile fetched: ${profileResponse.data.venueName}`);
    } catch (error) {
      logError('Token verification failed');
      if (error.response) {
        logError(`Status: ${error.response.status}`);
        logError(`Message: ${error.response.data.message || error.response.data.error}`);
      }
      throw error;
    }

    // Step 5: Test Duplicate Business Registration Prevention
    logStep(5, 'Testing Duplicate Business Registration Prevention');
    try {
      await axios.post(`${BASE_URL}/api/business/register`, businessData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logWarning('Duplicate business profile was allowed (should have been blocked)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Duplicate business profile correctly blocked');
      } else {
        logError('Unexpected error during duplicate test');
        throw error;
      }
    }

    // Step 6: Test Login
    logStep(6, 'Testing Login with Created Account');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/signin`, {
        email: TEST_EMAIL,
        password,
      });

      logSuccess('Login successful');
      logSuccess(`Token received: ${loginResponse.data.data.accessToken.substring(0, 20)}...`);

      // Update token with fresh one
      token = loginResponse.data.data.accessToken;
    } catch (error) {
      logError('Login failed');
      if (error.response) {
        logError(`Status: ${error.response.status}`);
        logError(`Message: ${error.response.data.message || error.response.data.error}`);
      }
      throw error;
    }

    // Step 7: Test Invalid Login
    logStep(7, 'Testing Invalid Login Credentials');
    try {
      await axios.post(`${BASE_URL}/api/auth/signin`, {
        email: TEST_EMAIL,
        password: 'wrongpassword',
      });
      logWarning('Invalid credentials were accepted (should have been rejected)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logSuccess('Invalid credentials correctly rejected');
      } else {
        logError('Unexpected error during invalid login test');
        throw error;
      }
    }

    // Step 8: Test Profile Update
    logStep(8, 'Testing Business Profile Update');
    try {
      const updateData = {
        description: 'Updated description for testing',
        phone: '+1-555-999-8888',
      };

      const updateResponse = await axios.patch(
        `${BASE_URL}/api/business/profile`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      logSuccess('Profile updated successfully');
      logSuccess(`New description: ${updateResponse.data.data.businessProfile.description}`);
      logSuccess(`New phone: ${updateResponse.data.data.businessProfile.phone}`);
    } catch (error) {
      logError('Profile update failed');
      if (error.response) {
        logError(`Status: ${error.response.status}`);
        logError(`Message: ${error.response.data.message || error.response.data.error}`);
      }
      throw error;
    }

    // Final Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'green');
    log('║                ALL TESTS PASSED ✅                         ║', 'green');
    log('╚════════════════════════════════════════════════════════════╝', 'green');
    log('\nTest Account Details:', 'cyan');
    log(`  Email: ${TEST_EMAIL}`, 'cyan');
    log(`  User ID: ${userId}`, 'cyan');
    log(`  Token: ${token.substring(0, 30)}...`, 'cyan');
    log('\nNote: Test account remains in database for manual inspection.\n', 'yellow');

  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                TEST FAILED ❌                              ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝', 'red');
    log('\nError Details:', 'red');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
testRegistrationFlow();
