# Database Seed Scripts

This directory contains scripts for seeding the database with test data.

## Available Seed Scripts

### 1. Basic User Seed (`seedData.js`)
Seeds only users with basic follow relationships.

**Usage:**
```bash
npm run seed
```

**What it creates:**
- 10 sample users with profile data
- Follow relationships between users
- Hashed phone numbers for contact sync testing
- Instagram usernames for social sync testing

### 2. Comprehensive Growth Features Seed (`seedGrowthFeatures.js`) ⭐
Seeds ALL models with realistic test data for complete app testing.

**Usage:**
```bash
npm run seed:all
```

**What it creates:**
- ✅ **8 Users** - With profiles, follows, and contact info
- ✅ **4 Venues** - Different types (club, lounge, bar) across SF
- ✅ **3 Performers** - DJs with genres and social links
- ✅ **4 Events** - Upcoming events at each venue with ticket tiers
- ✅ **3 Tickets** - Sample purchased tickets
- ✅ **2 Group Purchases** - Active group ticket splitting opportunities
- ✅ **3 Referrals** - Referral codes and rewards
- ✅ **3 Crews** - Friend groups with stats
- ✅ **2 Challenges** - Venue and spending challenges
- ✅ **3 Highlight Videos** - 15-second venue highlights
- ✅ **4 Dynamic Pricing** - Active pricing with discounts
- ✅ **2 Price Alerts** - User price notifications
- ✅ **3 Streaks** - User activity streaks
- ✅ **5 Memories** - User venue memories

## Important Notes

⚠️ **Development Only**
Both scripts will only run when `NODE_ENV=development`. They will fail in production to prevent accidental data loss.

⚠️ **Data Deletion**
Both scripts **clear all existing data** before seeding. Use with caution!

## Testing the App

After running `npm run seed:all`, you can test:

### Growth Features
1. **Group Purchases**
   - Navigate to any venue
   - You'll see active group purchase badges
   - Test joining a group purchase

2. **Referrals**
   - Go to Profile → Referrals
   - You'll see your referral code and stats
   - Test applying a referral code

3. **Events & Tickets**
   - Check Calendar for upcoming events
   - View ticket purchasing options
   - See purchased tickets in Profile

4. **Crews**
   - Go to Profile → Crews
   - See existing crews with members
   - Test creating a new crew

5. **Challenges**
   - View active challenges
   - See progress tracking
   - Test joining a challenge

6. **Performers**
   - Browse performers in Discovery
   - Follow performers to see their feed
   - View performer posts in Feed tab

7. **Highlights**
   - View 15-second highlight videos
   - See venue highlights (24-hour content)
   - Test uploading your own

8. **Dynamic Pricing**
   - Check venues for pricing badges
   - See discounts during slow hours
   - Set price alerts for favorite venues

9. **Streaks**
   - View your streaks in Profile
   - See streak progress and rewards
   - Test streak maintenance

10. **Memories**
    - View your memory timeline
    - See venue visit history
    - Create new memories from check-ins

## Sample Test Accounts

All users have the following format:
- **Phone**: `+1415555100X` (where X is 1-8)
- **Email**: `[name]@example.com`
- **Password**: Use the email to log in (if auth is configured)

**Sample Users:**
1. Sarah Chen - `+14155551001` / `sarah@example.com`
2. Marcus Wright - `+14155551002` / `marcus@example.com`
3. Emma Rodriguez - `+14155551003` / `emma@example.com`
4. Jordan Kim - `+14155551004` / `jordan@example.com`
5. Taylor Brooks - `+14155551005` / `taylor@example.com`

## Venues Created

1. **The Electric Warehouse** - Techno/House club (Mission St)
2. **Velvet Lounge** - Upscale lounge with jazz (Market St)
3. **Bass Drop Arena** - EDM/Dubstep club (Howard St)
4. **Rooftop 21** - Rooftop bar with views (Powell St)

## Customizing Seed Data

Edit `seedGrowthFeatures.js` to:
- Add more users, venues, or events
- Change venue locations
- Modify pricing or challenge parameters
- Add additional test scenarios

## Troubleshooting

### Script fails with "Collection not found"
**Solution:** Make sure your MongoDB connection is working and collections exist.

### "Cannot run in production" error
**Solution:** Set `NODE_ENV=development` in your `.env` file.

### No data showing in app
**Solution:**
1. Check backend is running (`npm start`)
2. Verify frontend API URL matches backend port
3. Check browser/Metro console for network errors
4. Restart the React Native app

### MongoDB connection error
**Solution:**
1. Ensure MongoDB is running (locally or Docker)
2. Check `MONGODB_URI` in `.env` file
3. Test connection: `mongosh $MONGODB_URI`

## Manual Seeding

You can also seed from the Node.js REPL:

```bash
cd backend
node
```

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const { seedDatabase } = require('./src/utils/seedGrowthFeatures');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await seedDatabase();
  await mongoose.connection.close();
  process.exit(0);
});
```

## Adding New Models

When adding a new model to the seed script:

1. Import the model at the top
2. Add to the "Clear existing data" section
3. Create seed data array
4. Add creation loop in appropriate section
5. Update the summary section
6. Test thoroughly!

## Best Practices

- **Always backup** before running seed scripts on important data
- **Use seed:all** for comprehensive testing of all features
- **Run regularly** during development to test with fresh data
- **Update seed data** to match your current schema
- **Add variety** - different types, statuses, and relationships

## Support

If you encounter issues:
1. Check the console output for specific errors
2. Verify your `.env` configuration
3. Ensure all models match current schemas
4. Try running with `NODE_ENV=development node src/utils/seedGrowthFeatures.js` for detailed logs
