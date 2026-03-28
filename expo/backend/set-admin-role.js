/**
 * Script to set a user's role to ADMIN
 * Usage: node set-admin-role.js <userId>
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function setAdminRole(userId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Update user role
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { role: 'ADMIN' } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User not found');
    } else if (result.modifiedCount > 0) {
      console.log(`✅ User ${userId} role set to ADMIN`);
    } else {
      console.log('⚠️  User already has ADMIN role');
    }

    // Verify
    const user = await mongoose.connection.db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { email: 1, displayName: 1, role: 1 } }
    );

    console.log('\n📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.displayName}`);
    console.log(`   Role: ${user.role}`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node set-admin-role.js <userId>');
  process.exit(1);
}

setAdminRole(userId);
