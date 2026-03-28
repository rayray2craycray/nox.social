# MongoDB Atlas - Quick Setup Guide (5 Minutes)

**Goal**: Get your production database running on MongoDB Atlas

---

## Step 1: Create MongoDB Atlas Account (2 minutes)

### 1.1 Sign Up
1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with:
   - Email: (your email)
   - Or use: Google / GitHub login
3. Verify your email

### 1.2 Create Organization
- Organization Name: `Rork Nightlife`
- Click "Next"

---

## Step 2: Create Free Cluster (2 minutes)

### 2.1 Choose Plan
- Select: **M0 (Free Forever)**
  - 512 MB storage
  - Shared RAM
  - Perfect for development/testing

### 2.2 Choose Region
- Cloud Provider: **AWS** (recommended)
- Region: Choose closest to your users:
  - US East (N. Virginia) - `us-east-1`
  - Europe (Ireland) - `eu-west-1`
  - Asia Pacific (Singapore) - `ap-southeast-1`

### 2.3 Cluster Name
- Name: `rork-nightlife-cluster`
- Click "Create Cluster"

⏳ **Wait 3-5 minutes for cluster to deploy...**

---

## Step 3: Create Database User (1 minute)

### 3.1 Security > Database Access
1. Click "Add New Database User"
2. Authentication Method: **Password**
3. Enter credentials:
   ```
   Username: rork-admin
   Password: [Generate secure password]
   ```

   **💡 SAVE THIS PASSWORD! You'll need it later.**

4. Database User Privileges:
   - Select: **Read and write to any database**

5. Click "Add User"

---

## Step 4: Configure Network Access (1 minute)

### 4.1 Security > Network Access
1. Click "Add IP Address"
2. For development:
   - Click "Allow Access from Anywhere"
   - IP: `0.0.0.0/0`
   - ⚠️ **For production, restrict to your server IP**

3. Click "Confirm"

---

## Step 5: Get Connection String

### 5.1 Database > Connect
1. Click "Connect" on your cluster
2. Choose: **Connect your application**
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. Copy connection string:
   ```
   mongodb+srv://rork-admin:<password>@rork-nightlife-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 5.2 Replace `<password>`
Replace `<password>` with your actual password from Step 3.1

**Final Connection String Example**:
```
mongodb+srv://rork-admin:YourSecurePassword123@rork-nightlife-cluster.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority
```

**Note**: Add `/rork-nightlife` before the `?` to specify database name.

---

## Step 6: Update Backend Configuration

### 6.1 Update `.env` file

Open `/backend/.env` and update:

```bash
# Production MongoDB Atlas
MONGODB_URI=mongodb+srv://rork-admin:YourSecurePassword123@rork-nightlife-cluster.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority

# Or keep local for development
# MONGODB_URI=mongodb://admin:password123@localhost:27017/rork-nightlife?authSource=admin
```

### 6.2 Test Connection

```bash
cd backend
npm start
```

Look for: `MongoDB Connected: rork-nightlife-cluster...`

---

## Step 7: Verify Data Migration (Optional)

If you want to migrate existing data from local MongoDB to Atlas:

### Export from local MongoDB:
```bash
docker exec rork-mongodb mongodump --authenticationDatabase admin -u admin -p password123 --db rork-nightlife --out /tmp/backup
docker cp rork-mongodb:/tmp/backup ./mongo-backup
```

### Import to Atlas:
```bash
mongorestore --uri "mongodb+srv://rork-admin:YourPassword@cluster.mongodb.net" --db rork-nightlife ./mongo-backup/rork-nightlife
```

---

## Quick Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster (rork-nightlife-cluster)
- [ ] Created database user (rork-admin)
- [ ] Configured network access (0.0.0.0/0 for dev)
- [ ] Copied connection string
- [ ] Updated backend/.env with Atlas URI
- [ ] Tested backend connection
- [ ] Verified data in Atlas dashboard

---

## What You Get (Free Tier)

✅ **512 MB Storage**
✅ **Shared RAM**
✅ **Automatic backups**
✅ **Built-in monitoring**
✅ **SSL/TLS encryption**
✅ **High availability**
✅ **No credit card required**

---

## Troubleshooting

### Connection Error: "Authentication failed"
- ✅ Check username and password
- ✅ Ensure password doesn't have special characters (or URL encode them)

### Connection Error: "Timeout"
- ✅ Check network access settings
- ✅ Ensure 0.0.0.0/0 is allowed (for development)
- ✅ Check firewall settings

### Connection Error: "Server not found"
- ✅ Wait 3-5 minutes after cluster creation
- ✅ Verify connection string format
- ✅ Check cluster name in connection string

---

## Next Steps

After MongoDB Atlas is working:

1. ✅ Update production environment variables
2. ✅ Test all API endpoints with Atlas
3. ✅ Set up Cloudinary for file uploads
4. ✅ Deploy backend to production server

---

## Useful Links

- **Atlas Dashboard**: https://cloud.mongodb.com
- **Connection Guide**: https://www.mongodb.com/docs/atlas/driver-connection/
- **Free Tier Limits**: https://www.mongodb.com/pricing

---

**Estimated Time**: 5-10 minutes
**Cost**: $0 (Free Forever M0 tier)
**Status**: Ready to use in production! ✅
