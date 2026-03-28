/**
 * Seed Database with Test Data
 * Creates sample users with hashed phone numbers for testing
 */

const crypto = require('crypto');
const User = require('../models/User');

// Hash phone number using SHA-256 (same as client)
function hashPhoneNumber(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

// Sample users with various connection types
const sampleUsers = [
  {
    displayName: 'Sarah Chen',
    phone: '+14155551001',
    bio: 'Love electronic music and nightlife!',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    instagramUsername: 'sarah_vibes',
    instagramId: 'ig_sarah_001',
  },
  {
    displayName: 'Marcus Wright',
    phone: '+14155551002',
    bio: 'DJ and music producer',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    instagramUsername: 'marcus_nightlife',
    instagramId: 'ig_marcus_002',
  },
  {
    displayName: 'Emma Rodriguez',
    phone: '+14155551003',
    bio: 'Techno enthusiast',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    instagramUsername: 'emma_techno',
    instagramId: 'ig_emma_003',
  },
  {
    displayName: 'Jordan Kim',
    phone: '+14155551004',
    bio: 'EDM lover and event organizer',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    instagramUsername: 'jordan.edm',
    instagramId: 'ig_jordan_004',
  },
  {
    displayName: 'Taylor Brooks',
    phone: '+14155551005',
    bio: 'House music all night long',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    instagramUsername: 'taylor_party',
    instagramId: 'ig_taylor_005',
  },
  {
    displayName: 'Alex Morgan',
    phone: '+14155551006',
    bio: 'Professional party-goer',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    instagramUsername: 'alex_nightowl',
    instagramId: 'ig_alex_006',
  },
  {
    displayName: 'Chris Anderson',
    phone: '+14155551007',
    bio: 'Music is life',
    avatarUrl: 'https://i.pravatar.cc/150?img=20',
    instagramUsername: 'chris_beats',
    instagramId: 'ig_chris_007',
  },
  {
    displayName: 'Sam Taylor',
    phone: '+14155551008',
    bio: 'Club hopper',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    instagramUsername: 'sam_clubs',
    instagramId: 'ig_sam_008',
  },
  {
    displayName: 'Jamie Lee',
    phone: '+14155551009',
    bio: 'Rave enthusiast',
    avatarUrl: 'https://i.pravatar.cc/150?img=30',
    instagramUsername: 'jamie_rave',
    instagramId: 'ig_jamie_009',
  },
  {
    displayName: 'Pat Rivera',
    phone: '+14155551010',
    bio: 'Underground music fan',
    avatarUrl: 'https://i.pravatar.cc/150?img=35',
    instagramUsername: 'pat_underground',
    instagramId: 'ig_pat_010',
  },
];

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Clear existing users (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      console.log('Cleared existing users');
    }

    // Create users with hashed phone numbers
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create({
        ...userData,
        phoneHash: hashPhoneNumber(userData.phone),
      });
      createdUsers.push(user);
      console.log(`Created user: ${user.displayName} (${user._id})`);
    }

    // Create some follower relationships
    if (createdUsers.length >= 5) {
      // Sarah follows Marcus, Emma, Jordan
      await User.findByIdAndUpdate(createdUsers[0]._id, {
        $addToSet: { following: [createdUsers[1]._id, createdUsers[2]._id, createdUsers[3]._id] },
      });

      // Marcus follows Sarah, Emma
      await User.findByIdAndUpdate(createdUsers[1]._id, {
        $addToSet: { following: [createdUsers[0]._id, createdUsers[2]._id] },
      });

      // Emma follows Sarah, Marcus, Jordan
      await User.findByIdAndUpdate(createdUsers[2]._id, {
        $addToSet: { following: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[3]._id] },
      });

      console.log('Created follow relationships');
    }

    console.log(`\n✅ Database seeded successfully with ${createdUsers.length} users!`);
    console.log('\nSample phone numbers (for testing contact sync):');
    sampleUsers.forEach(user => {
      console.log(`  ${user.displayName}: ${user.phone}`);
    });

    console.log('\nSample Instagram usernames (for testing Instagram sync):');
    sampleUsers.forEach(user => {
      console.log(`  @${user.instagramUsername}`);
    });

    console.log('\n💡 Use these phone numbers in your contacts to test matching!');

    return createdUsers;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await seedDatabase();
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, sampleUsers, hashPhoneNumber };
