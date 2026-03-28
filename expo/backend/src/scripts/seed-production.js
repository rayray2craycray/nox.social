/**
 * Production Database Seeding Script
 * Seeds the database with initial data for growth features
 *
 * Usage:
 * node src/scripts/seed-production.js
 *
 * Environment:
 * Ensure MONGODB_URI is set in your environment
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Venue = require('../models/Venue');
const Event = require('../models/Event');
const Challenge = require('../models/Challenge');
const Crew = require('../models/Crew');
const DynamicPricing = require('../models/DynamicPricing');

// Connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Seed users
async function seedUsers() {
  console.log('\n📝 Seeding users...');

  const users = [
    {
      email: 'demo@nox.social',
      displayName: 'Demo User',
      password: 'Demo123!', // Will be hashed by model
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

  try {
    // Check if users already exist
    const existingUsers = await User.find({ email: { $in: users.map(u => u.email) } });

    if (existingUsers.length > 0) {
      console.log('⚠️  Demo users already exist. Skipping...');
      return existingUsers;
    }

    // Use create() instead of insertMany() to trigger password hashing middleware
    const createdUsers = await Promise.all(
      users.map(userData => User.create(userData))
    );
    console.log(`✅ Created ${createdUsers.length} demo users`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

// Seed events
async function seedEvents(venues) {
  console.log('\n📝 Seeding events...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const events = venues.slice(0, 3).map((venue, index) => ({
    venueId: venue._id,
    title: [
      'Saturday Night Live DJ Session',
      'Latin Music Night',
      'Electronic Dance Party',
    ][index],
    description: [
      'Join us for an unforgettable night with top DJs spinning the hottest tracks!',
      'Experience the rhythm of Latin music with live performances and dancing all night.',
      'Get ready for an electrifying night of EDM with world-class DJs!',
    ][index],
    date: index === 0 ? tomorrow : nextWeek,
    startTime: '22:00',
    endTime: '04:00',
    capacity: venue.capacity || 350, // Use venue capacity or default to 350
    genres: [
      ['House', 'Techno', 'EDM'],
      ['Salsa', 'Bachata', 'Reggaeton'],
      ['EDM', 'Trance', 'Dubstep'],
    ][index],
    imageUrl: `https://images.unsplash.com/photo-${1534687182866 + index}-unsplash?w=800`,
    ticketTiers: [
      {
        name: 'Early Bird',
        price: 15,
        quantity: 100,
        sold: 45,
        tier: 'EARLY_BIRD',
        salesWindow: {
          start: now,
          end: tomorrow,
        },
        isAppExclusive: true,
      },
      {
        name: 'General Admission',
        price: 25,
        quantity: 200,
        sold: 23,
        tier: 'GENERAL',
        salesWindow: {
          start: now,
          end: nextWeek,
        },
        isAppExclusive: false,
      },
      {
        name: 'VIP',
        price: 50,
        quantity: 50,
        sold: 12,
        tier: 'VIP',
        salesWindow: {
          start: now,
          end: nextWeek,
        },
        isAppExclusive: false,
      },
    ],
  }));

  try {
    const existingEvents = await Event.find({ venueId: { $in: venues.map(v => v._id) } });

    if (existingEvents.length > 0) {
      console.log('⚠️  Demo events already exist. Skipping...');
      return existingEvents;
    }

    const createdEvents = await Event.insertMany(events);
    console.log(`✅ Created ${createdEvents.length} demo events`);
    return createdEvents;
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    throw error;
  }
}

// Seed challenges
async function seedChallenges(venues) {
  console.log('\n📝 Seeding challenges...');

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const challenges = [
    {
      venueId: venues[0]?._id,
      type: 'VISIT_COUNT',
      title: 'Weekend Warrior',
      description: 'Visit any venue 3 weekends in a row',
      requirements: {
        type: 'VISITS',
        target: 3,
      },
      reward: {
        type: 'SKIP_LINE',
        value: 1,
        description: 'Skip the line on your next visit',
      },
      difficulty: 'MEDIUM',
      startDate: now,
      endDate,
      isActive: true,
    },
    {
      type: 'SPEND_AMOUNT',
      title: 'Big Spender',
      description: 'Spend $200 at any venue this month',
      requirements: {
        type: 'SPENDING',
        target: 200,
      },
      reward: {
        type: 'DISCOUNT',
        value: 20,
        description: '20% off your next visit',
      },
      difficulty: 'HARD',
      startDate: now,
      endDate,
      isActive: true,
    },
    {
      type: 'VISIT_COUNT',
      title: 'Social Butterfly',
      description: 'Visit 5 different venues this month',
      requirements: {
        type: 'CUSTOM',
        target: 5,
      },
      reward: {
        type: 'FREE_ITEM',
        value: 1,
        description: 'Free drink at your next visit',
      },
      difficulty: 'MEDIUM',
      startDate: now,
      endDate,
      isActive: true,
    },
  ];

  try {
    const existingChallenges = await Challenge.find({ title: { $in: challenges.map(c => c.title) } });

    if (existingChallenges.length > 0) {
      console.log('⚠️  Demo challenges already exist. Skipping...');
      return existingChallenges;
    }

    const createdChallenges = await Challenge.insertMany(challenges);
    console.log(`✅ Created ${createdChallenges.length} demo challenges`);
    return createdChallenges;
  } catch (error) {
    console.error('❌ Error seeding challenges:', error);
    throw error;
  }
}

// Seed dynamic pricing
async function seedDynamicPricing(venues) {
  console.log('\n📝 Seeding dynamic pricing...');

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setHours(validUntil.getHours() + 2);

  const pricingData = venues.slice(0, 3).map((venue, index) => ({
    venueId: venue._id,
    basePrice: 20,
    currentPrice: [15, 12, 18][index],
    discountPercentage: [25, 40, 10][index],
    reason: ['SLOW_HOUR', 'APP_EXCLUSIVE', 'HAPPY_HOUR'][index],
    validUntil,
    conditions: {
      daysOfWeek: index === 0 ? ['Monday', 'Tuesday'] : undefined,
      timeRange: index === 1 ? { start: '17:00', end: '20:00' } : undefined,
    },
  }));

  try {
    // Remove existing pricing for demo venues
    await DynamicPricing.deleteMany({ venueId: { $in: venues.map(v => v._id) } });

    const createdPricing = await DynamicPricing.insertMany(pricingData);
    console.log(`✅ Created ${createdPricing.length} dynamic pricing entries`);
    return createdPricing;
  } catch (error) {
    console.error('❌ Error seeding dynamic pricing:', error);
    throw error;
  }
}

// Seed venues
async function seedVenues() {
  console.log('\n🏢 Seeding venues...');

  const venuesData = [
    {
      name: 'The Electric Lounge',
      type: 'CLUB',
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522] // [longitude, latitude]
        }
      },
      capacity: 500,
      priceLevel: 3,
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
      tags: ['Energetic', 'Modern', 'Upscale'],
      genres: ['EDM', 'House', 'Techno'],
      features: ['Bar', 'VIP Section', 'Coat Check', 'Outdoor Patio'],
      hours: {
        monday: '9:00 PM - 2:00 AM',
        friday: '10:00 PM - 3:00 AM',
        saturday: '10:00 PM - 3:00 AM',
        sunday: '9:00 PM - 2:00 AM'
      },
      isOpen: false
    },
    {
      name: 'Sunset Rooftop Bar',
      type: 'BAR',
      location: {
        latitude: 34.0983,
        longitude: -118.3467,
        address: '456 Sunset Blvd',
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [-118.3467, 34.0983]
        }
      },
      capacity: 150,
      priceLevel: 2,
      imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
      tags: ['Chill', 'Romantic', 'Scenic'],
      genres: ['Jazz', 'Lounge', 'Acoustic'],
      features: ['Outdoor Seating', 'Cocktails', 'Small Plates'],
      hours: {
        wednesday: '5:00 PM - 11:00 PM',
        thursday: '5:00 PM - 11:00 PM',
        friday: '5:00 PM - 1:00 AM',
        saturday: '5:00 PM - 1:00 AM'
      },
      isOpen: false
    },
    {
      name: 'Bass Underground',
      type: 'CLUB',
      location: {
        latitude: 34.0407,
        longitude: -118.2548,
        address: '789 Downtown Ave',
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [-118.2548, 34.0407]
        }
      },
      capacity: 300,
      priceLevel: 2,
      imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
      tags: ['Underground', 'Energetic', 'Edgy'],
      genres: ['Dubstep', 'Drum and Bass', 'Trap'],
      features: ['Sound System', 'Laser Lights', 'Bar'],
      hours: {
        friday: '10:00 PM - 4:00 AM',
        saturday: '10:00 PM - 4:00 AM'
      },
      isOpen: false
    }
  ];

  try {
    // Check if venues already exist
    const existingCount = await Venue.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} venues already exist, skipping venue creation`);
      return await Venue.find().limit(5);
    }

    const createdVenues = await Venue.insertMany(venuesData);
    console.log(`✅ Created ${createdVenues.length} venues`);
    return createdVenues;
  } catch (error) {
    console.error('❌ Error seeding venues:', error);
    throw error;
  }
}

// Main seed function
async function seedAll() {
  console.log('🌱 Starting production database seeding...\n');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'Unknown'}\n`);

  try {
    await connectDB();

    // Seed venues first (will skip if venues already exist)
    const venues = await seedVenues();

    console.log(`✅ Using ${venues.length} venues for seeding`);

    // Seed data
    await seedUsers();
    await seedEvents(venues);
    await seedChallenges(venues);
    await seedDynamicPricing(venues);

    console.log('\n✅ Production seeding completed successfully!');
    console.log('\n📋 Seeded Data Summary:');
    console.log('   - Demo users for testing');
    console.log('   - Events with ticket tiers');
    console.log('   - Challenges for user engagement');
    console.log('   - Dynamic pricing for promotions');

    console.log('\n🔐 Demo User Credentials:');
    console.log('   Email: demo@nox.social');
    console.log('   Password: Demo123!');
    console.log('\n   Email: venue.owner@nox.social');
    console.log('   Password: VenueOwner123!');

    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Change demo user passwords immediately');
    console.log('   2. Create real venue data through the app');
    console.log('   3. Monitor seed data and remove when ready');
    console.log('   4. Set up automated backups');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };
