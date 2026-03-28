/**
 * Comprehensive Seed Script for Growth Features
 * Seeds all models with realistic test data
 *
 * Usage: node src/utils/seedGrowthFeatures.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import models
const User = require('../models/User');
const Venue = require('../models/Venue');
const Performer = require('../models/Performer');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const GroupPurchase = require('../models/GroupPurchase');
const Referral = require('../models/Referral');
const Crew = require('../models/Crew');
const Challenge = require('../models/Challenge');
const HighlightVideo = require('../models/HighlightVideo');
const DynamicPricing = require('../models/DynamicPricing');
const PriceAlert = require('../models/PriceAlert');
const Streak = require('../models/Streak');
const Memory = require('../models/Memory');

// Helper: Hash phone number
function hashPhoneNumber(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

// Helper: Random element from array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper: Random date in range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Sample data
const sampleUsers = [
  {
    displayName: 'Sarah Chen',
    phone: '+14155551001',
    email: 'sarah@example.com',
    bio: 'Love electronic music and nightlife!',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    instagramUsername: 'sarah_vibes',
    instagramId: 'ig_sarah_001',
  },
  {
    displayName: 'Marcus Wright',
    phone: '+14155551002',
    email: 'marcus@example.com',
    bio: 'DJ and music producer',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    instagramUsername: 'marcus_nightlife',
    instagramId: 'ig_marcus_002',
  },
  {
    displayName: 'Emma Rodriguez',
    phone: '+14155551003',
    email: 'emma@example.com',
    bio: 'Techno enthusiast',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    instagramUsername: 'emma_techno',
    instagramId: 'ig_emma_003',
  },
  {
    displayName: 'Jordan Kim',
    phone: '+14155551004',
    email: 'jordan@example.com',
    bio: 'EDM lover and event organizer',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    instagramUsername: 'jordan.edm',
    instagramId: 'ig_jordan_004',
  },
  {
    displayName: 'Taylor Brooks',
    phone: '+14155551005',
    email: 'taylor@example.com',
    bio: 'House music all night long',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    instagramUsername: 'taylor_party',
    instagramId: 'ig_taylor_005',
  },
  {
    displayName: 'Alex Morgan',
    phone: '+14155551006',
    email: 'alex@example.com',
    bio: 'Professional party-goer',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    instagramUsername: 'alex_nightowl',
    instagramId: 'ig_alex_006',
  },
  {
    displayName: 'Chris Anderson',
    phone: '+14155551007',
    email: 'chris@example.com',
    bio: 'Music is life',
    avatarUrl: 'https://i.pravatar.cc/150?img=20',
    instagramUsername: 'chris_beats',
    instagramId: 'ig_chris_007',
  },
  {
    displayName: 'Sam Taylor',
    phone: '+14155551008',
    email: 'sam@example.com',
    bio: 'Club hopper',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    instagramUsername: 'sam_clubs',
    instagramId: 'ig_sam_008',
  },
];

const sampleVenues = [
  {
    name: 'The Electric Warehouse',
    type: 'CLUB',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Mission St',
      city: 'San Francisco',
      state: 'CA',
      coordinates: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
      },
    },
    rating: 4.5,
    priceLevel: 3,
    imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2',
    tags: ['Electronic', 'Techno', 'Late Night'],
    genres: ['Techno', 'House', 'EDM'],
    capacity: 500,
    features: ['Dance Floor', 'VIP Area', 'Outdoor Patio'],
    coverCharge: 20,
    description: 'Premier electronic music venue with world-class sound system',
  },
  {
    name: 'Velvet Lounge',
    type: 'LOUNGE',
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: '456 Market St',
      city: 'San Francisco',
      state: 'CA',
      coordinates: {
        type: 'Point',
        coordinates: [-122.4094, 37.7849],
      },
    },
    rating: 4.2,
    priceLevel: 4,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    tags: ['Upscale', 'Cocktails', 'Live Music'],
    genres: ['Jazz', 'R&B', 'Soul'],
    capacity: 150,
    features: ['Live Music', 'Premium Cocktails', 'Bottle Service'],
    coverCharge: 30,
    description: 'Sophisticated lounge with craft cocktails and live performances',
  },
  {
    name: 'Bass Drop Arena',
    type: 'CLUB',
    location: {
      latitude: 37.7649,
      longitude: -122.4294,
      address: '789 Howard St',
      city: 'San Francisco',
      state: 'CA',
      coordinates: {
        type: 'Point',
        coordinates: [-122.4294, 37.7649],
      },
    },
    rating: 4.7,
    priceLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1571266028243-d220c8a93c44',
    tags: ['EDM', 'Bass Music', 'College Night'],
    genres: ['Dubstep', 'Trap', 'Bass House'],
    capacity: 800,
    features: ['Massive Dance Floor', 'LED Stage', 'Multiple Rooms'],
    coverCharge: 15,
    description: 'Largest bass music venue in the city',
  },
  {
    name: 'Rooftop 21',
    type: 'BAR',
    location: {
      latitude: 37.7949,
      longitude: -122.3994,
      address: '321 Powell St',
      city: 'San Francisco',
      state: 'CA',
      coordinates: {
        type: 'Point',
        coordinates: [-122.3994, 37.7949],
      },
    },
    rating: 4.4,
    priceLevel: 3,
    imageUrl: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db',
    tags: ['Rooftop', 'Views', 'Happy Hour'],
    genres: ['Top 40', 'Hip Hop'],
    capacity: 200,
    features: ['Rooftop', 'City Views', 'Full Bar'],
    coverCharge: 10,
    description: 'Stunning rooftop bar with panoramic city views',
  },
];

const samplePerformers = [
  {
    name: 'Alex Thompson',
    stageName: 'DJ Nexus',
    bio: 'Techno & progressive house producer',
    genres: ['Techno', 'Progressive House'],
    imageUrl: 'https://i.pravatar.cc/300?img=33',
    socialMedia: {
      instagram: 'https://instagram.com/djnexus',
      soundcloud: 'https://soundcloud.com/djnexus',
    },
    followerCount: 15000,
    isVerified: true,
  },
  {
    name: 'Luna Martinez',
    stageName: 'Luna Beats',
    bio: 'Deep house & melodic techno',
    genres: ['Deep House', 'Melodic Techno'],
    imageUrl: 'https://i.pravatar.cc/300?img=45',
    socialMedia: {
      instagram: 'https://instagram.com/lunabeats',
      spotify: 'https://open.spotify.com/artist/lunabeats',
    },
    followerCount: 22000,
    isVerified: true,
  },
  {
    name: 'Mike Johnson',
    stageName: 'Bass King',
    bio: 'Dubstep & bass music specialist',
    genres: ['Dubstep', 'Trap', 'Bass House'],
    imageUrl: 'https://i.pravatar.cc/300?img=51',
    socialMedia: {
      instagram: 'https://instagram.com/bassking',
      soundcloud: 'https://soundcloud.com/bassking',
    },
    followerCount: 18500,
    isVerified: true,
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seed...\n');

    // Only clear in development
    if (process.env.NODE_ENV !== 'development') {
      console.error('❌ This script can only run in development environment!');
      process.exit(1);
    }

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Performer.deleteMany({}),
      Event.deleteMany({}),
      Ticket.deleteMany({}),
      GroupPurchase.deleteMany({}),
      Referral.deleteMany({}),
      Crew.deleteMany({}),
      Challenge.deleteMany({}),
      HighlightVideo.deleteMany({}),
      DynamicPricing.deleteMany({}),
      PriceAlert.deleteMany({}),
      Streak.deleteMany({}),
      Memory.deleteMany({}),
    ]);
    console.log('✅ Cleared all collections\n');

    // ========== SEED USERS ==========
    console.log('👥 Creating users...');
    const users = [];
    for (const userData of sampleUsers) {
      const user = await User.create({
        ...userData,
        phoneHash: hashPhoneNumber(userData.phone),
      });
      users.push(user);
      console.log(`  ✓ ${user.displayName}`);
    }

    // Create follow relationships
    await User.findByIdAndUpdate(users[0]._id, {
      $addToSet: { following: [users[1]._id, users[2]._id, users[3]._id] },
    });
    await User.findByIdAndUpdate(users[1]._id, {
      $addToSet: { following: [users[0]._id, users[2]._id] },
    });
    console.log(`✅ Created ${users.length} users with follow relationships\n`);

    // ========== SEED VENUES ==========
    console.log('🏢 Creating venues...');
    const venues = [];
    for (const venueData of sampleVenues) {
      const venue = await Venue.create(venueData);
      venues.push(venue);
      console.log(`  ✓ ${venue.name}`);
    }
    console.log(`✅ Created ${venues.length} venues\n`);

    // ========== SEED PERFORMERS ==========
    console.log('🎤 Creating performers...');
    const performers = [];
    for (const performerData of samplePerformers) {
      const performer = await Performer.create(performerData);
      performers.push(performer);
      console.log(`  ✓ ${performer.stageName}`);
    }
    console.log(`✅ Created ${performers.length} performers\n`);

    // ========== SEED EVENTS ==========
    console.log('🎉 Creating events...');
    const events = [];
    const eventNames = [
      'Techno Tuesday',
      'House Music Friday',
      'Bass Weekend',
      'Rooftop Sessions',
    ];

    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      const event = await Event.create({
        venueId: venue._id,
        title: eventNames[i] || `Night at ${venue.name}`,
        description: `An unforgettable night of music at ${venue.name}`,
        performerIds: [performers[i % performers.length]._id],
        date: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // Next few weeks
        startTime: '22:00',
        endTime: '04:00',
        genres: venue.genres,
        imageUrl: venue.imageUrl,
        capacity: venue.capacity,
        ticketTiers: [
          {
            name: 'Early Bird',
            price: venue.coverCharge * 0.8,
            quantity: 50,
            sold: 20,
            tier: 'EARLY_BIRD',
            salesWindow: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            isAppExclusive: true,
          },
          {
            name: 'General Admission',
            price: venue.coverCharge,
            quantity: 200,
            sold: 85,
            tier: 'GENERAL',
            salesWindow: {
              start: new Date(),
              end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            isAppExclusive: false,
          },
          {
            name: 'VIP',
            price: venue.coverCharge * 2,
            quantity: 30,
            sold: 10,
            tier: 'VIP',
            salesWindow: {
              start: new Date(),
              end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            isAppExclusive: false,
          },
        ],
      });
      events.push(event);
      console.log(`  ✓ ${event.title} at ${venue.name}`);
    }
    console.log(`✅ Created ${events.length} events\n`);

    // ========== SEED TICKETS ==========
    console.log('🎫 Creating tickets...');
    const tickets = [];
    for (let i = 0; i < 3; i++) {
      const ticket = await Ticket.create({
        eventId: events[0]._id,
        userId: users[i]._id,
        tierId: events[0].ticketTiers[0]._id,
        qrCode: `QR-${Date.now()}-${i}`,
        status: 'ACTIVE',
        purchasePrice: events[0].ticketTiers[0].price,
      });
      tickets.push(ticket);
    }
    console.log(`✅ Created ${tickets.length} tickets\n`);

    // ========== SEED GROUP PURCHASES ==========
    console.log('🤝 Creating group purchases...');
    const groupPurchases = [];
    for (let i = 0; i < 2; i++) {
      const groupPurchase = await GroupPurchase.create({
        initiatorId: users[i]._id,
        venueId: venues[i]._id,
        eventId: events[i]._id,
        ticketType: 'ENTRY',
        totalAmount: 100,
        perPersonAmount: 20,
        maxParticipants: 5,
        currentParticipants: [users[i]._id, users[i + 1]._id],
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      groupPurchases.push(groupPurchase);
      console.log(`  ✓ Group purchase at ${venues[i].name}`);
    }
    console.log(`✅ Created ${groupPurchases.length} group purchases\n`);

    // ========== SEED REFERRALS ==========
    console.log('💝 Creating referrals...');
    const referrals = [];
    for (let i = 0; i < 3; i++) {
      const referral = await Referral.create({
        referrerId: users[i]._id,
        refereeId: users[i + 1]._id,
        referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: i === 0 ? 'REWARDED' : 'COMPLETED',
        rewardType: 'DISCOUNT',
        rewardValue: 10,
      });
      if (referral.status === 'REWARDED') {
        referral.rewardedAt = new Date();
        await referral.save();
      }
      referrals.push(referral);
    }
    console.log(`✅ Created ${referrals.length} referrals\n`);

    // ========== SEED CREWS ==========
    console.log('👯 Creating crews...');
    const crews = [];
    const crewNames = ['Night Owls', 'Bass Heads', 'House Party'];
    for (let i = 0; i < 3; i++) {
      const crew = await Crew.create({
        name: crewNames[i],
        ownerId: users[i]._id,
        memberIds: [users[i]._id, users[i + 1]._id, users[i + 2]._id],
        description: `The best ${crewNames[i].toLowerCase()} in the city`,
        isPrivate: i === 2,
        stats: {
          totalNightsOut: Math.floor(Math.random() * 50) + 10,
          favoriteVenue: venues[0]._id,
        },
      });
      crews.push(crew);
      console.log(`  ✓ ${crew.name}`);
    }
    console.log(`✅ Created ${crews.length} crews\n`);

    // ========== SEED CHALLENGES ==========
    console.log('🏆 Creating challenges...');
    const challenges = [];
    const challengeData = [
      {
        venueId: venues[0]._id,
        type: 'VISIT_COUNT',
        title: 'Warehouse Warrior',
        description: 'Visit The Electric Warehouse 5 times this month',
        requirements: { type: 'VISITS', target: 5 },
        reward: {
          type: 'SKIP_LINE',
          value: 1,
          description: 'Skip the line on your next visit',
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'SPEND_AMOUNT',
        title: 'Big Spender',
        description: 'Spend $200 at any venue this month',
        requirements: { type: 'SPENDING', target: 200 },
        reward: {
          type: 'DISCOUNT',
          value: 20,
          description: '20% off next visit',
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const data of challengeData) {
      const challenge = await Challenge.create(data);
      challenges.push(challenge);
      console.log(`  ✓ ${challenge.title}`);
    }
    console.log(`✅ Created ${challenges.length} challenges\n`);

    // ========== SEED HIGHLIGHT VIDEOS ==========
    console.log('🎬 Creating highlight videos...');
    const highlights = [];
    for (let i = 0; i < 3; i++) {
      const highlight = await HighlightVideo.create({
        userId: users[i]._id,
        venueId: venues[i % venues.length]._id,
        videoUrl: `https://example.com/highlights/video-${i}.mp4`,
        thumbnailUrl: `https://example.com/highlights/thumb-${i}.jpg`,
        duration: 15,
        views: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 100) + 10,
        isActive: true,
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
      });
      highlights.push(highlight);
    }
    console.log(`✅ Created ${highlights.length} highlight videos\n`);

    // ========== SEED DYNAMIC PRICING ==========
    console.log('💰 Creating dynamic pricing...');
    const pricings = [];
    for (let i = 0; i < venues.length; i++) {
      const pricing = await DynamicPricing.create({
        venueId: venues[i]._id,
        basePrice: venues[i].coverCharge,
        currentPrice: venues[i].coverCharge * (i === 0 ? 0.8 : 1),
        discountPercentage: i === 0 ? 20 : 0,
        reason: i === 0 ? 'SLOW_HOUR' : 'PEAK_HOUR',
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      });
      pricings.push(pricing);
    }
    console.log(`✅ Created ${pricings.length} dynamic pricing entries\n`);

    // ========== SEED PRICE ALERTS ==========
    console.log('🔔 Creating price alerts...');
    const alerts = [];
    for (let i = 0; i < 2; i++) {
      const alert = await PriceAlert.create({
        userId: users[i]._id,
        venueId: venues[i]._id,
        targetDiscount: 20,
        isActive: true,
      });
      alerts.push(alert);
    }
    console.log(`✅ Created ${alerts.length} price alerts\n`);

    // ========== SEED STREAKS ==========
    console.log('🔥 Creating streaks...');
    const streaks = [];
    const streakTypes = ['WEEKEND_WARRIOR', 'VENUE_LOYALTY', 'SOCIAL_BUTTERFLY'];
    for (let i = 0; i < users.length && i < 3; i++) {
      const streak = await Streak.create({
        userId: users[i]._id,
        type: streakTypes[i],
        currentStreak: Math.floor(Math.random() * 10) + 1,
        longestStreak: Math.floor(Math.random() * 20) + 5,
        lastActivityDate: new Date(),
        rewards: {
          milestones: [5, 10, 15, 20],
          currentRewards: [],
        },
      });
      streaks.push(streak);
      console.log(`  ✓ ${users[i].displayName}: ${streak.type} (${streak.currentStreak} days)`);
    }
    console.log(`✅ Created ${streaks.length} streaks\n`);

    // ========== SEED MEMORIES ==========
    console.log('📸 Creating memories...');
    const memories = [];
    for (let i = 0; i < users.length && i < 5; i++) {
      const memory = await Memory.create({
        userId: users[i]._id,
        venueId: venues[i % venues.length]._id,
        date: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
        type: randomElement(['CHECK_IN', 'VIDEO', 'PHOTO']),
        content: {
          imageUrl: `https://images.unsplash.com/photo-${1566417713940 + i}`,
          caption: `Great night at ${venues[i % venues.length].name}!`,
        },
        isPrivate: i % 3 === 0,
      });
      memories.push(memory);
    }
    console.log(`✅ Created ${memories.length} memories\n`);

    // ========== SUMMARY ==========
    console.log('=' .repeat(50));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  🏢 Venues: ${venues.length}`);
    console.log(`  🎤 Performers: ${performers.length}`);
    console.log(`  🎉 Events: ${events.length}`);
    console.log(`  🎫 Tickets: ${tickets.length}`);
    console.log(`  🤝 Group Purchases: ${groupPurchases.length}`);
    console.log(`  💝 Referrals: ${referrals.length}`);
    console.log(`  👯 Crews: ${crews.length}`);
    console.log(`  🏆 Challenges: ${challenges.length}`);
    console.log(`  🎬 Highlight Videos: ${highlights.length}`);
    console.log(`  💰 Dynamic Pricing: ${pricings.length}`);
    console.log(`  🔔 Price Alerts: ${alerts.length}`);
    console.log(`  🔥 Streaks: ${streaks.length}`);
    console.log(`  📸 Memories: ${memories.length}`);
    console.log('=' .repeat(50));

    console.log('\n💡 Test User Credentials:');
    sampleUsers.forEach(user => {
      console.log(`  ${user.displayName}: ${user.phone} / ${user.email}`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('  1. Restart your React Native app');
    console.log('  2. All features should now display data!');
    console.log('  3. Try exploring venues, events, and growth features\n');

    return {
      users,
      venues,
      performers,
      events,
      tickets,
      groupPurchases,
      referrals,
      crews,
      challenges,
      highlights,
      pricings,
      alerts,
      streaks,
      memories,
    };
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB\n');
      await seedDatabase();
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database connection error:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
