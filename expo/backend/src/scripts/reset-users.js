const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '.env.production' });

async function resetUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing demo users
    const result = await User.deleteMany({
      email: { $in: ['demo@nox.social', 'venue.owner@nox.social'] }
    });
    console.log(`🗑️  Deleted ${result.deletedCount} existing users`);

    // Create new users with properly hashed passwords
    const users = [
      {
        email: 'demo@nox.social',
        displayName: 'Demo User',
        password: 'Demo123!',
        isEmailVerified: true,
      },
      {
        email: 'venue.owner@nox.social',
        displayName: 'Venue Owner',
        password: 'VenueOwner123!',
        isEmailVerified: true,
        role: 'USER',
      },
    ];

    const createdUsers = await Promise.all(
      users.map(userData => User.create(userData))
    );

    console.log(`✅ Created ${createdUsers.length} users with hashed passwords`);
    console.log('📧 Demo accounts:');
    console.log('   demo@nox.social / Demo123!');
    console.log('   venue.owner@nox.social / VenueOwner123!');

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetUsers();
