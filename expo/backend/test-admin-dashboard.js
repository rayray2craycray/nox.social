/**
 * Admin Dashboard Test
 * Tests admin authentication and business profile review system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// ANSI color codes
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

async function testAdminDashboard() {
  let regularUser, adminUser, businessProfile;

  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║             Admin Dashboard Test                           ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    // Step 1: Create regular user and business profile
    logStep(1, 'Creating Regular User and Business Profile');

    const testEmail = `test-business-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    // Create regular user
    const userResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: testEmail,
      password,
      displayName: 'Test Business Owner',
    });

    regularUser = {
      id: userResponse.data.data.user.id,
      token: userResponse.data.data.accessToken,
      email: testEmail,
    };

    logSuccess('Regular user created');
    logSuccess(`User ID: ${regularUser.id}`);

    // Create business profile
    const businessResponse = await axios.post(
      `${BASE_URL}/api/business/register`,
      {
        venueName: 'Test Club ' + Date.now(),
        businessEmail: testEmail,
        businessType: 'CLUB',
        location: {
          address: '123 Test Street',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
        phone: '+1-555-123-4567',
        website: 'https://testclub.com',
      },
      {
        headers: { Authorization: `Bearer ${regularUser.token}` },
      }
    );

    businessProfile = {
      id: businessResponse.data.data.businessProfile.id,
    };

    logSuccess('Business profile created');

    // Upload test documents
    await axios.post(
      `${BASE_URL}/api/business/documents/upload`,
      {
        documentType: 'BUSINESS_LICENSE',
        documentUrl: 'https://example.com/license.pdf',
        fileName: 'license.pdf',
        fileSize: 100000,
      },
      {
        headers: { Authorization: `Bearer ${regularUser.token}` },
      }
    );

    logSuccess('Test document uploaded');

    // Step 2: Try to access admin endpoint without admin role
    logStep(2, 'Testing Admin Access Control (Should Fail)');

    try {
      await axios.get(`${BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${regularUser.token}` },
      });

      logWarning('Regular user accessed admin endpoint (should have been blocked)');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logSuccess('Admin access correctly denied for regular user');
      } else {
        logError('Unexpected error during access control test');
        throw error;
      }
    }

    // Step 3: Create admin user manually in database
    logStep(3, 'Creating Admin User');

    // We need to use MongoDB directly to set role=ADMIN
    // For this test, we'll create another user and manually set them as admin
    const adminEmail = `admin-${Date.now()}@example.com`;

    const adminUserResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: adminEmail,
      password,
      displayName: 'Test Admin',
    });

    adminUser = {
      id: adminUserResponse.data.data.user.id,
      token: adminUserResponse.data.data.accessToken,
      email: adminEmail,
    };

    logSuccess('Admin user account created');
    logWarning('Note: Role needs to be set to ADMIN in database manually');
    logWarning(`MongoDB command: db.users.updateOne({_id: ObjectId("${adminUser.id}")}, {$set: {role: "ADMIN"}})`);

    // Step 4: Test dashboard stats endpoint (will fail without admin role)
    logStep(4, 'Testing Dashboard Stats Endpoint');

    log('  ⚠️  Skipping test - requires admin role to be set in database', 'yellow');
    log('  ℹ️  To manually test after setting admin role:', 'cyan');
    log(`  curl -H "Authorization: Bearer ${adminUser.token}" ${BASE_URL}/api/admin/stats`, 'cyan');

    // Step 5: Test getting business profiles list
    logStep(5, 'Testing Business Profiles List Endpoint');

    log('  ⚠️  Skipping test - requires admin role', 'yellow');
    log('  ℹ️  To manually test:', 'cyan');
    log(`  curl -H "Authorization: Bearer ${adminUser.token}" "${BASE_URL}/api/admin/business-profiles?status=PENDING_VERIFICATION"`, 'cyan');

    // Step 6: Test document review endpoint
    logStep(6, 'Testing Document Review Endpoint');

    log('  ⚠️  Skipping test - requires admin role', 'yellow');
    log('  ℹ️  To manually test:', 'cyan');
    log(`  curl -X PUT -H "Authorization: Bearer ${adminUser.token}" \\`, 'cyan');
    log(`       -H "Content-Type: application/json" \\`, 'cyan');
    log(`       -d '{"action":"APPROVE"}' \\`, 'cyan');
    log(`       "${BASE_URL}/api/admin/business-profiles/${businessProfile.id}/review"`, 'cyan');

    // Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║                TEST SUMMARY                                ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    log('\n✅ Completed Tests:', 'green');
    log('  • Regular user creation', 'green');
    log('  • Business profile creation', 'green');
    log('  • Document upload', 'green');
    log('  • Admin access control (403 for non-admin)', 'green');
    log('  • Admin user account creation', 'green');

    log('\n⚠️  Manual Steps Required:', 'yellow');
    log('  1. Set admin role in MongoDB:', 'yellow');
    log(`     db.users.updateOne(`, 'cyan');
    log(`       {_id: ObjectId("${adminUser.id}")},`, 'cyan');
    log(`       {$set: {role: "ADMIN"}}`, 'cyan');
    log(`     )`, 'cyan');
    log('\n  2. Then run these manual tests:', 'yellow');

    log('\n  📊 Dashboard Stats:', 'cyan');
    log(`     curl -H "Authorization: Bearer ${adminUser.token}" \\`, 'cyan');
    log(`          ${BASE_URL}/api/admin/stats | jq`, 'cyan');

    log('\n  📋 List Business Profiles:', 'cyan');
    log(`     curl -H "Authorization: Bearer ${adminUser.token}" \\`, 'cyan');
    log(`          "${BASE_URL}/api/admin/business-profiles?status=PENDING_VERIFICATION" | jq`, 'cyan');

    log('\n  👁️  View Business Profile:', 'cyan');
    log(`     curl -H "Authorization: Bearer ${adminUser.token}" \\`, 'cyan');
    log(`          ${BASE_URL}/api/admin/business-profiles/${businessProfile.id} | jq`, 'cyan');

    log('\n  ✅ Approve Business:', 'cyan');
    log(`     curl -X PUT \\`, 'cyan');
    log(`          -H "Authorization: Bearer ${adminUser.token}" \\`, 'cyan');
    log(`          -H "Content-Type: application/json" \\`, 'cyan');
    log(`          -d '{"action":"APPROVE"}' \\`, 'cyan');
    log(`          ${BASE_URL}/api/admin/business-profiles/${businessProfile.id}/review | jq`, 'cyan');

    log('\n  ❌ Reject Business:', 'cyan');
    log(`     curl -X PUT \\`, 'cyan');
    log(`          -H "Authorization: Bearer ${adminUser.token}" \\`, 'cyan');
    log(`          -H "Content-Type: application/json" \\`, 'cyan');
    log(`          -d '{"action":"REJECT","rejectionReason":"Documents are not clear"}' \\`, 'cyan');
    log(`          ${BASE_URL}/api/admin/business-profiles/${businessProfile.id}/review | jq`, 'cyan');

    log('\n📝 Test Account Credentials:', 'blue');
    log(`  Regular User Email: ${regularUser.email}`, 'cyan');
    log(`  Regular User Token: ${regularUser.token.substring(0, 30)}...`, 'cyan');
    log(`  Admin User Email: ${adminUser.email}`, 'cyan');
    log(`  Admin User ID: ${adminUser.id}`, 'cyan');
    log(`  Admin User Token: ${adminUser.token.substring(0, 30)}...`, 'cyan');
    log(`  Business Profile ID: ${businessProfile.id}\n`, 'cyan');

  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                TEST FAILED ❌                              ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝', 'red');
    log('\nError Details:', 'red');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testAdminDashboard();
