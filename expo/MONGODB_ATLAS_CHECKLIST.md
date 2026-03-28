# MongoDB Atlas Setup - Checklist

Use this checklist to track your MongoDB Atlas setup progress.

---

## ✅ Pre-Setup (Already Done)

- [x] Backend authentication system implemented
- [x] Local MongoDB working correctly
- [x] Test data created and verified
- [x] Connection test scripts prepared

---

## 📋 Setup Steps (Do These Now)

### Step 1: Create Atlas Account
- [ ] Go to https://www.mongodb.com/cloud/atlas/register
- [ ] Sign up with email or OAuth (Google/GitHub)
- [ ] Verify email address
- [ ] Create organization: "Rork Nightlife"

**Time**: 2 minutes

---

### Step 2: Create Cluster
- [ ] Choose M0 (Free) tier
- [ ] Select cloud provider: AWS
- [ ] Choose region closest to users:
  - [ ] US East (N. Virginia) - us-east-1
  - [ ] Europe (Ireland) - eu-west-1
  - [ ] Asia Pacific (Singapore) - ap-southeast-1
- [ ] Name cluster: `rork-nightlife-cluster`
- [ ] Click "Create Cluster"
- [ ] Wait 3-5 minutes for deployment

**Time**: 2 minutes + 5 minutes wait

---

### Step 3: Create Database User
- [ ] Navigate to: Security > Database Access
- [ ] Click "Add New Database User"
- [ ] Choose "Password" authentication
- [ ] Set username: `rork-admin`
- [ ] Generate/set secure password
- [ ] **SAVE PASSWORD SECURELY** ⚠️
  ```
  Username: rork-admin
  Password: ___________________________
  ```
- [ ] Set privileges: "Read and write to any database"
- [ ] Click "Add User"

**Time**: 1 minute

---

### Step 4: Configure Network Access
- [ ] Navigate to: Security > Network Access
- [ ] Click "Add IP Address"
- [ ] For development: Choose "Allow Access from Anywhere"
  - IP Address: `0.0.0.0/0`
  - ⚠️ **Note**: Restrict this in production!
- [ ] Click "Confirm"

**Time**: 1 minute

---

### Step 5: Get Connection String
- [ ] Navigate to: Database > Clusters
- [ ] Click "Connect" on your cluster
- [ ] Choose: "Connect your application"
- [ ] Select:
  - Driver: Node.js
  - Version: 5.5 or later
- [ ] Copy connection string
- [ ] Connection string format:
  ```
  mongodb+srv://rork-admin:<password>@rork-nightlife-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- [ ] Replace `<password>` with your actual password
- [ ] Add database name before `?`:
  ```
  mongodb+srv://rork-admin:YourPassword@rork-nightlife-cluster.xxxxx.mongodb.net/rork-nightlife?retryWrites=true&w=majority
  ```

**Final Connection String**:
```
___________________________________________________________________________
```

**Time**: 2 minutes

---

### Step 6: Update Backend Configuration
- [ ] Open `backend/.env`
- [ ] Update `MONGODB_URI` with Atlas connection string
- [ ] Keep backup of local MongoDB URI (commented)
  ```bash
  # Production MongoDB Atlas
  MONGODB_URI=mongodb+srv://rork-admin:YourPassword@cluster.mongodb.net/rork-nightlife?retryWrites=true&w=majority

  # Local MongoDB (backup)
  # MONGODB_URI=mongodb://admin:password123@localhost:27017/rork-nightlife?authSource=admin
  ```
- [ ] Save file

**Time**: 1 minute

---

### Step 7: Test Connection
- [ ] Open terminal in `backend/` directory
- [ ] Run test script:
  ```bash
  node test-atlas-connection.js
  ```
- [ ] Verify output shows:
  - [ ] ✅ Successfully connected to MongoDB Atlas
  - [ ] Database name: rork-nightlife
  - [ ] Write operation successful
  - [ ] Read operation successful
  - [ ] Database stats displayed

**Time**: 1 minute

---

### Step 8: Start Backend with Atlas
- [ ] Run backend:
  ```bash
  npm start
  ```
- [ ] Check console output:
  - [ ] "MongoDB Connected: rork-nightlife-cluster..."
  - [ ] No connection errors
- [ ] Test API endpoint:
  ```bash
  curl http://localhost:3000/health
  ```

**Time**: 1 minute

---

### Step 9: Test Authentication with Atlas
- [ ] Test sign-up:
  ```bash
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"atlas-test@example.com","password":"test123456","displayName":"Atlas Test User"}'
  ```
  - [ ] Response: success=true, user created
  - [ ] Access token received

- [ ] Test sign-in:
  ```bash
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"atlas-test@example.com","password":"test123456"}'
  ```
  - [ ] Response: success=true, tokens received

**Time**: 2 minutes

---

### Step 10: Verify Data in Atlas Dashboard
- [ ] Go to: Database > Browse Collections
- [ ] Verify collections exist:
  - [ ] users
  - [ ] refreshtokens
- [ ] Click on `users` collection
- [ ] Verify test user is there:
  - [ ] Email: atlas-test@example.com
  - [ ] Password hashed (starts with $2b$10$)
  - [ ] createdAt timestamp present

**Time**: 1 minute

---

## 🎉 Completion Status

**Total Time**: ~15 minutes

### When All Steps Complete:
- [ ] MongoDB Atlas cluster running
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Backend configured
- [ ] Connection tested
- [ ] API endpoints working
- [ ] Data visible in Atlas dashboard

---

## 📊 What You Have Now

✅ **Production Database**
- Free tier (512 MB)
- High availability (3 replicas)
- Automatic backups
- SSL/TLS encryption
- Built-in monitoring

✅ **Backend Connected**
- Authentication system working
- All contexts using real user IDs
- Data stored in cloud

✅ **Ready for Production**
- Can deploy backend anywhere
- Database accessible globally
- No infrastructure management needed

---

## 🔧 Useful Commands

### Switch to Local MongoDB (for development)
```bash
cd backend
./switch-database.sh
# Choose option 1 (Local MongoDB)
```

### Switch to Atlas (for production)
```bash
cd backend
./switch-database.sh
# Choose option 2 (MongoDB Atlas)
# Paste your connection string
```

### Test Current Connection
```bash
cd backend
node test-atlas-connection.js
```

### View Database Stats
```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const stats = await mongoose.connection.db.stats();
  console.log('Data Size:', (stats.dataSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Collections:', stats.collections);
  console.log('Documents:', stats.objects);
  process.exit(0);
});
"
```

---

## ❓ Troubleshooting

### "Authentication failed"
- ✅ Check username and password in connection string
- ✅ Verify password doesn't have special characters (or URL encode)
- ✅ Confirm database user has correct permissions

### "Connection timeout"
- ✅ Wait a few minutes if cluster was just created
- ✅ Check network access (0.0.0.0/0 for dev)
- ✅ Verify firewall allows MongoDB connections

### "Database not found"
- ✅ Ensure database name is in connection string
- ✅ Format: `.../rork-nightlife?retryWrites=...`

---

## 📞 Support

- **Atlas Documentation**: https://www.mongodb.com/docs/atlas/
- **Connection Guide**: https://www.mongodb.com/docs/atlas/driver-connection/
- **Community Forums**: https://www.mongodb.com/community/forums/

---

## 🎯 Next Steps (After Atlas Setup)

1. [ ] Set up Cloudinary for image/video uploads
2. [ ] Configure production environment variables
3. [ ] Deploy backend to production server
4. [ ] Update mobile app with production API URL
5. [ ] Test end-to-end with production database

---

**Current Progress**: Setup preparation complete! ✅
**Next Action**: Follow Steps 1-10 above to complete Atlas setup
