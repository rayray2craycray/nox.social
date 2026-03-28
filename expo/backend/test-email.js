#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Tests SMTP connection and sends a verification email
 *
 * Usage:
 *   node test-email.js
 *   node test-email.js test@example.com
 */

require('dotenv').config();
const { sendVerificationEmail } = require('./src/services/email.service');
const readline = require('readline');

// ANSI colors
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

async function promptEmail() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nEnter test email address (or press Enter to skip): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function testEmailConfiguration() {
  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║           Email Configuration Test                        ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    // Check environment variables
    log('\n📋 Configuration Check:', 'cyan');

    const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const optionalVars = ['SMTP_PORT', 'SMTP_FROM'];

    let hasAllRequired = true;

    requiredVars.forEach((varName) => {
      if (process.env[varName]) {
        log(`   ✅ ${varName}: ${maskValue(process.env[varName])}`, 'green');
      } else {
        log(`   ❌ ${varName}: Not set`, 'red');
        hasAllRequired = false;
      }
    });

    optionalVars.forEach((varName) => {
      if (process.env[varName]) {
        log(`   ℹ️  ${varName}: ${process.env[varName]}`, 'cyan');
      } else {
        log(`   ⚠️  ${varName}: Using default`, 'yellow');
      }
    });

    if (!hasAllRequired) {
      log('\n❌ Missing required SMTP configuration!', 'red');
      log('\nRequired variables:', 'yellow');
      log('  SMTP_HOST     - SMTP server hostname', 'yellow');
      log('  SMTP_USER     - SMTP username or API key', 'yellow');
      log('  SMTP_PASS     - SMTP password or API key', 'yellow');
      log('\nOptional variables:', 'cyan');
      log('  SMTP_PORT     - SMTP port (default: 587)', 'cyan');
      log('  SMTP_FROM     - Sender email address', 'cyan');
      log('\n💡 See EMAIL_SETUP_GUIDE.md for setup instructions', 'cyan');
      process.exit(1);
    }

    // Get test email
    let testEmail = process.argv[2];

    if (!testEmail) {
      log('\n📧 Email Test:', 'cyan');
      testEmail = await promptEmail();
    }

    if (!testEmail) {
      log('\n⚠️  No email provided. Skipping email send test.', 'yellow');
      log('✅ Configuration check passed. SMTP is configured correctly.', 'green');
      log('\n💡 To send a test email, run: node test-email.js test@example.com', 'cyan');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      log(`\n❌ Invalid email format: ${testEmail}`, 'red');
      process.exit(1);
    }

    // Send test email
    log(`\n📤 Sending test verification email to ${testEmail}...`, 'cyan');

    const result = await sendVerificationEmail(
      testEmail,
      'Test Nightclub',
      `https://nox.social/verify?token=test123&timestamp=${Date.now()}`
    );

    if (result.mode === 'dev') {
      log('\n⚠️  Development Mode:', 'yellow');
      log('   SMTP not fully configured - email logged to console', 'yellow');
      log('   Check logs above for email content', 'yellow');
    } else {
      log('\n✅ Email sent successfully!', 'green');
      if (result.messageId) {
        log(`   Message ID: ${result.messageId}`, 'green');
      }
      log(`\n📬 Check ${testEmail} for the verification email`, 'cyan');
      log('   Subject: "Verify your business email for Test Nightclub"', 'cyan');
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║                Test Complete                               ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    if (result.mode !== 'dev') {
      log('\n✅ SMTP Configuration: Working', 'green');
      log('✅ Email Delivery: Success', 'green');
      log('\n💡 Tips:', 'cyan');
      log('   - Check spam folder if email not received', 'cyan');
      log('   - Verify sender email is authenticated in SMTP provider', 'cyan');
      log('   - Monitor delivery in your SMTP provider dashboard', 'cyan');
    } else {
      log('\n⚠️  Development Mode Active', 'yellow');
      log('\n📝 To enable production email:', 'cyan');
      log('   1. Choose SMTP provider (SendGrid, Mailgun, etc.)', 'cyan');
      log('   2. Set SMTP credentials in .env', 'cyan');
      log('   3. See EMAIL_SETUP_GUIDE.md for detailed instructions', 'cyan');
    }

    log('');
  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                Test Failed                                 ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝', 'red');

    log(`\n❌ Error: ${error.message}`, 'red');

    if (error.message.includes('authentication')) {
      log('\n💡 Authentication Error - Check:', 'yellow');
      log('   - SMTP_USER is correct', 'yellow');
      log('   - SMTP_PASS is correct', 'yellow');
      log('   - For SendGrid: User must be "apikey" (literal)', 'yellow');
      log('   - For Gmail: Use App Password, not regular password', 'yellow');
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      log('\n💡 Connection Timeout - Check:', 'yellow');
      log('   - SMTP_HOST is correct', 'yellow');
      log('   - Firewall allows outbound connections on SMTP_PORT', 'yellow');
      log('   - Try port 465 or 2525 if 587 fails', 'yellow');
    } else if (error.message.includes('ECONNREFUSED')) {
      log('\n💡 Connection Refused - Check:', 'yellow');
      log('   - SMTP_HOST is correct', 'yellow');
      log('   - SMTP_PORT is correct', 'yellow');
      log('   - Internet connection is active', 'yellow');
    }

    log('\n📖 See EMAIL_SETUP_GUIDE.md for troubleshooting', 'cyan');
    log('');

    process.exit(1);
  }
}

function maskValue(value) {
  if (!value) return '';
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

// Run test
testEmailConfiguration();
