# MongoDB Atlas Setup Guide

## Overview

MongoDB Atlas is a fully managed cloud database service. This guide will help you set up a production-ready MongoDB database for the Rork Nightlife app.

---

## Step 1: Create MongoDB Atlas Account

1. **Visit MongoDB Atlas**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Click "Try Free" or "Start Free"

2. **Sign Up**
   - Use your email or sign up with Google
   - Verify your email address

3. **Complete Organization Setup**
   - Organization Name: "Rork" or your company name
   - Project Name: "rork-nightlife-app"

---

## Step 2: Create a Free Cluster

1. **Choose Cluster Type**
   - Select "M0 Sandbox" (Free Forever)
   - 512 MB storage (sufficient for development/MVP)

2. **Select Cloud Provider & Region**
   - Provider: AWS (recommended) or Google Cloud
   - Region: Choose closest to your users
     - US: us-east-1 (Virginia) or us-west-2 (Oregon)
     - EU: eu-west-1 (Ireland)
     - Asia: ap-southeast-1 (Singapore)

3. **Cluster Name**
   - Name: `rork-cluster` (or any name you prefer)
   - Click "Create Cluster" (takes 3-5 minutes)

---

## Step 3: Configure Database Access

### Create Database User

1. **Navigate to Database Access**
   - In left sidebar: Security > Database Access
   - Click "Add New Database User"

2. **Authentication Method**
   - Choose "Password"
   - Username: `rork-admin` (or your choice)
   - Password: Generate a strong password (save this!)
   - OR use "Autogenerate Secure Password" and copy it

3. **Database User Privileges**
   - Built-in Role: "Read and write to any database"
   - Click "Add User"

**IMPORTANT**: Save your username and password securely! You'll need them for the connection string.

---

## Step 4: Configure Network Access

### Add IP Address

1. **Navigate to Network Access**
   - In left sidebar: Security > Network Access
   - Click "Add IP Address"

2. **Allow Access**

   **Option A: Development (Local)**
   - Click "Allow Access from Anywhere"
   - IP Address: `0.0.0.0/0`
   - Click "Confirm"
   - ⚠️ WARNING: Only use for development!

   **Option B: Production (Recommended)**
   - Add your server's specific IP address
   - Description: "Production Server"
   - Click "Confirm"

3. **Wait for Status**
   - Status will change to "Active" in 1-2 minutes

---

## Step 5: Get Connection String

1. **Navigate to Database**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster

2. **Choose Connection Method**
   - Select "Connect your application"

3. **Configure Connection**
   - Driver: Node.js
   - Version: 4.1 or later

4. **Copy Connection String**
   ```
   mongodb+srv://rork-admin:<password>@rork-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. **Replace Placeholder**
   - Replace `<password>` with your actual password
   - Replace `?retryWrites...` with `/rork?retryWrites=true&w=majority`

   **Final Format**:
   ```
   mongodb+srv://rork-admin:YOUR_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork?retryWrites=true&w=majority
   ```

---

## Step 6: Create Database and Collections

You can either:

### Option A: Let Mongoose Auto-Create (Easiest)

Your backend will automatically create collections when you first insert data.

### Option B: Manually Create (Recommended for Production)

1. **Navigate to Collections**
   - Click "Browse Collections" on your cluster
   - Click "Create Database"

2. **Database Details**
   - Database Name: `rork`
   - Collection Name: `users` (start with one collection)
   - Click "Create"

3. **Create Additional Collections** (optional)
   - Click "+ Create Collection" to add:
     - `venues`
     - `events`
     - `tickets`
     - `crews`
     - `challenges`
     - `memories`
     - `streaks`
     - etc.

---

## Step 7: Update Backend Configuration

### 1. Install Mongoose (if not already installed)

```bash
cd backend
npm install mongoose
```

### 2. Create `.env` File

Create `/backend/.env`:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://rork-admin:YOUR_PASSWORD@rork-cluster.xxxxx.mongodb.net/rork?retryWrites=true&w=majority

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Cloudinary (add later)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Update Backend Connection

Create or update `/backend/config/database.ts`:

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rork';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+
      // but included for compatibility
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});
```

### 4. Update `/backend/server.ts`

```typescript
import express from 'express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to database
connectDatabase();

// Your routes here...

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## Step 8: Test Connection

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Check Console Output

You should see:
```
✅ MongoDB Atlas connected successfully
📊 Database: rork
🌐 Host: rork-cluster.xxxxx.mongodb.net
🚀 Server running on port 3000
```

### 3. Test with a Simple Query

Create `/backend/test-db.ts`:

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connection successful!');

    // Create a test collection
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));

    // Insert test document
    await TestModel.create({ name: 'Test Connection' });
    console.log('✅ Test document created');

    // Read test document
    const docs = await TestModel.find();
    console.log('✅ Test documents:', docs);

    await mongoose.connection.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
};

testConnection();
```

Run it:
```bash
npx ts-node backend/test-db.ts
```

---

## Step 9: Production Best Practices

### 1. Enable Backups

- Go to cluster → Backup tab
- Configure Cloud Backup (free for M10+ clusters)
- M0 clusters: Use `mongodump` manually

### 2. Set Up Monitoring

- Navigate to Metrics tab
- Set up alerts for:
  - High CPU usage
  - Storage approaching limit
  - Connection spikes

### 3. Create Database Indexes

For better performance, create indexes in your models:

```typescript
// Example: User model
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true },
  displayName: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});
```

### 4. Use Connection Pooling

Mongoose handles this automatically, but you can configure:

```typescript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10, // Maximum number of connections
  minPoolSize: 5,  // Minimum number of connections
});
```

### 5. Secure Your Connection String

**Never commit `.env` to Git!**

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

---

## Step 10: Upgrade Path (Future)

When you're ready to scale:

### Free Tier Limitations
- Storage: 512 MB
- RAM: Shared
- Connections: 500 concurrent

### Upgrade to M10 ($0.08/hour = ~$57/month)
- Storage: 10 GB
- RAM: 2 GB
- Connections: Unlimited
- Automatic backups
- Performance insights

To upgrade:
1. Go to your cluster
2. Click "⚙️ Configuration"
3. Choose "M10" or higher
4. Apply changes (no downtime!)

---

## Troubleshooting

### Connection Timeout

**Problem**: `MongoServerSelectionError: connection timed out`

**Solutions**:
1. Check IP whitelist (0.0.0.0/0 for testing)
2. Verify connection string format
3. Check username/password (no special URL characters)
4. Ensure cluster is running (green status)

### Authentication Failed

**Problem**: `MongoServerError: bad auth`

**Solutions**:
1. Verify username and password
2. URL-encode special characters in password
3. Check user has correct database privileges

### Database Not Found

**Problem**: Collections not appearing

**Solutions**:
1. Check database name in connection string
2. Ensure data has been inserted (collections appear after first write)
3. Refresh the collections view

---

## Useful Commands

### Check Connection Status
```typescript
const status = mongoose.connection.readyState;
// 0 = disconnected
// 1 = connected
// 2 = connecting
// 3 = disconnecting
```

### Get Database Stats
```typescript
const stats = await mongoose.connection.db.stats();
console.log(stats);
```

### List Collections
```typescript
const collections = await mongoose.connection.db.listCollections().toArray();
console.log(collections.map(c => c.name));
```

---

## Cost Estimate

### Free Tier (M0)
- **Cost**: $0/month forever
- **Storage**: 512 MB
- **Good for**: Development, MVP, small apps

### Paid Tiers
- **M10**: ~$57/month (10GB storage, 2GB RAM)
- **M20**: ~$130/month (20GB storage, 4GB RAM)
- **M30**: ~$240/month (40GB storage, 8GB RAM)

### Cost Optimization Tips
1. Start with M0 (free)
2. Monitor storage usage in Atlas dashboard
3. Use indexes to reduce query time
4. Archive old data to keep under limits
5. Upgrade only when approaching limits

---

## Next Steps

✅ MongoDB Atlas is now set up!

Continue to:
1. [Cloudinary Setup](./CLOUDINARY_SETUP.md) - For image/video uploads
2. [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Complete config
3. [Backend API](./BACKEND_API_SETUP.md) - Auth endpoints

---

**Questions?**
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/docs/
- Support: https://support.mongodb.com/

---

**Last Updated**: 2026-01-18
