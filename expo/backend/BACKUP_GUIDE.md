# Database Backup & Restore Guide

Complete guide for backing up and restoring the MongoDB database for the Rork Nightlife application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Manual Backup](#manual-backup)
4. [Automated Backups](#automated-backups)
5. [Restore Database](#restore-database)
6. [Backup Configuration](#backup-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

The backup system provides:

- **Automated daily backups** at 2:00 AM
- **Manual on-demand backups**
- **30-day retention policy** (configurable)
- **Automatic cleanup** of old backups
- **Interactive restore** with backup selection
- **Backup statistics** and monitoring

### File Structure

```
backend/
├── scripts/
│   ├── backup-database.js       # Backup script
│   ├── restore-database.js      # Restore script
│   └── setup-backup-cron.sh     # Cron job setup
├── backups/                      # Backup storage (git-ignored)
│   ├── backup-2026-01-28T10-30-00/
│   ├── backup-2026-01-29T02-00-00/
│   └── ...
└── logs/
    └── backup-cron.log          # Automated backup logs
```

---

## Prerequisites

### Install MongoDB Database Tools

The backup system requires `mongodump` and `mongorestore` from MongoDB Database Tools.

#### macOS (Homebrew):
```bash
brew install mongodb-database-tools
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install mongodb-database-tools
```

#### Download directly:
[https://www.mongodb.com/try/download/database-tools](https://www.mongodb.com/try/download/database-tools)

### Verify Installation

```bash
mongodump --version
mongorestore --version
```

---

## Manual Backup

### Create a Backup

```bash
node scripts/backup-database.js
```

### Output Example

```
╔════════════════════════════════════════════════════════════╗
║           MongoDB Database Backup                          ║
╚════════════════════════════════════════════════════════════╝

📦 Starting backup...
   Database: localhost/rork-nightlife
   Backup location: /path/to/backups/backup-2026-01-29T10-30-00

✅ Backup completed successfully!
   Size: 45.3 MB
   Location: /path/to/backups/backup-2026-01-29T10-30-00

🧹 Cleaning up old backups (retention: 30 days)...
   No old backups to delete

📊 Backup Statistics:
   Total backups: 5
   Total size: 227.8 MB
   Oldest backup: 1/25/2026, 2:00:00 AM

✅ Backup process completed
```

---

## Automated Backups

### Setup Cron Job

Run the setup script to configure automated daily backups:

```bash
chmod +x scripts/setup-backup-cron.sh
./scripts/setup-backup-cron.sh
```

This will:
- Create a cron job to run backups daily at 2:00 AM
- Create a log directory for backup logs
- Verify prerequisites

### View Backup Logs

```bash
# View all logs
cat logs/backup-cron.log

# View logs in real-time (for testing)
tail -f logs/backup-cron.log
```

### Manage Cron Jobs

```bash
# View all cron jobs
crontab -l

# Edit cron jobs manually
crontab -e

# Remove all cron jobs (careful!)
crontab -r
```

### Change Backup Schedule

Edit the cron schedule in `scripts/setup-backup-cron.sh`:

```bash
# Current: Daily at 2:00 AM
CRON_SCHEDULE="0 2 * * *"

# Examples:
# Every 6 hours:    "0 */6 * * *"
# Twice daily:      "0 2,14 * * *"
# Weekly (Sunday):  "0 2 * * 0"
# Hourly:           "0 * * * *"
```

---

## Restore Database

### Interactive Restore (Recommended)

```bash
node scripts/restore-database.js
```

This will:
1. Show all available backups
2. Let you select which backup to restore
3. Confirm before proceeding
4. Restore the selected backup

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║           Available Backups                                ║
╚════════════════════════════════════════════════════════════╝

1. backup-2026-01-29T10-30-00
   Date: 1/29/2026, 10:30:00 AM
   Size: 45.3 MB

2. backup-2026-01-29T02-00-00
   Date: 1/29/2026, 2:00:00 AM
   Size: 44.9 MB

Select backup number (or press Enter for most recent): 1

📦 Selected backup:
   Name: backup-2026-01-29T10-30-00
   Date: 1/29/2026, 10:30:00 AM
   Size: 45.3 MB

⚠️  WARNING: This will REPLACE your current database!
   All current data will be lost.

Are you sure you want to continue? (yes/no): yes

📥 Starting restore...
   Target database: rork-nightlife

✅ Database restored successfully!
   Restored from: backup-2026-01-29T10-30-00
   Date: 1/29/2026, 10:30:00 AM
```

### Direct Restore (Non-Interactive)

```bash
node scripts/restore-database.js backup-2026-01-29T10-30-00
```

---

## Backup Configuration

### Environment Variables

Create or update `.env` file:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/rork-nightlife

# Optional - Backup Configuration
BACKUP_DIR=./backups                # Default: ./backups
BACKUP_RETENTION_DAYS=30            # Default: 30 days
```

### Retention Policy

Backups older than `BACKUP_RETENTION_DAYS` are automatically deleted during each backup operation.

**Change retention period:**

```bash
# .env file
BACKUP_RETENTION_DAYS=60  # Keep backups for 60 days
```

### Custom Backup Location

```bash
# .env file
BACKUP_DIR=/mnt/backup-drive/rork-backups

# Or use environment variable
BACKUP_DIR=/external/backups node scripts/backup-database.js
```

---

## Troubleshooting

### Error: mongodump not found

**Solution:** Install MongoDB Database Tools (see [Prerequisites](#prerequisites))

### Error: MONGODB_URI not set

**Solution:** Set `MONGODB_URI` in `.env` file:

```bash
MONGODB_URI=mongodb://localhost:27017/rork-nightlife
```

### Error: Permission denied

**Solution:** Make scripts executable:

```bash
chmod +x scripts/backup-database.js
chmod +x scripts/restore-database.js
chmod +x scripts/setup-backup-cron.sh
```

### Backups taking too much space

**Solutions:**

1. **Reduce retention period:**
   ```bash
   BACKUP_RETENTION_DAYS=14  # Keep only 2 weeks
   ```

2. **Change backup location:**
   ```bash
   BACKUP_DIR=/mnt/large-drive/backups
   ```

3. **Compress old backups:**
   ```bash
   cd backups
   tar -czf backup-2026-01-20.tar.gz backup-2026-01-20T02-00-00/
   rm -rf backup-2026-01-20T02-00-00/
   ```

### Cron job not running

**Check cron service:**

```bash
# macOS
sudo launchctl list | grep cron

# Linux
sudo systemctl status cron
```

**Check cron logs:**

```bash
# View backup cron logs
cat logs/backup-cron.log

# View system cron logs (Linux)
sudo tail -f /var/log/syslog | grep CRON

# View system cron logs (macOS)
sudo log show --predicate 'process == "cron"' --last 1h
```

**Verify cron job exists:**

```bash
crontab -l | grep backup
```

---

## Best Practices

### 1. Test Backups Regularly

Create a test restore procedure:

```bash
# 1. Create a test database
mongorestore --uri="mongodb://localhost:27017/rork-nightlife-test" \
  --drop backups/backup-2026-01-29T10-30-00/

# 2. Verify data integrity
mongosh rork-nightlife-test --eval "db.users.countDocuments()"
```

### 2. Monitor Backup Size

```bash
# Check total backup size
du -sh backups/

# List backups by size
du -h backups/* | sort -h
```

### 3. Offsite Backups

**Option 1: Cloud Storage (AWS S3)**

```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure

# Sync backups to S3
aws s3 sync backups/ s3://your-bucket/rork-backups/
```

**Option 2: Cloud Storage (Google Cloud)**

```bash
# Install gsutil
brew install google-cloud-sdk

# Sync backups
gsutil -m rsync -r backups/ gs://your-bucket/rork-backups/
```

**Option 3: Rsync to Remote Server**

```bash
# Sync to remote server
rsync -avz --delete backups/ user@backup-server:/backups/rork-nightlife/
```

### 4. Backup Before Major Changes

```bash
# Before deploying new version
node scripts/backup-database.js

# Tag the backup
mv backups/backup-2026-01-29T10-30-00 \
   backups/backup-before-v2.0-deployment
```

### 5. Verify Backups

Add this to your cron job for verification:

```bash
# After backup, verify it's not empty
LATEST_BACKUP=$(ls -t backups/ | head -1)
if [ -z "$(ls -A backups/$LATEST_BACKUP)" ]; then
    echo "ERROR: Backup is empty!" | mail -s "Backup Failed" admin@example.com
fi
```

### 6. Monitor Disk Space

```bash
# Check available space
df -h

# Alert if backup partition is >80% full
USAGE=$(df -h | grep '/backups' | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "Backup partition is ${USAGE}% full"
fi
```

---

## Production Deployment

### For Production Servers

1. **Use dedicated backup server:**
   ```bash
   BACKUP_DIR=/mnt/backup-volume/rork-backups
   ```

2. **Enable backup notifications:**
   ```bash
   # Add to backup-database.js
   # Send email/Slack notification on success/failure
   ```

3. **Set up monitoring:**
   ```bash
   # Use monitoring service to track:
   # - Backup completion
   # - Backup size
   # - Backup failures
   ```

4. **Configure backup encryption:**
   ```bash
   # Encrypt backups before storing
   tar -czf - backup-dir/ | openssl enc -aes-256-cbc -out backup.tar.gz.enc
   ```

5. **Set appropriate retention:**
   ```bash
   # Production: Keep more backups
   BACKUP_RETENTION_DAYS=90  # 3 months
   ```

---

## Quick Reference

### Common Commands

```bash
# Create manual backup
node scripts/backup-database.js

# Restore latest backup (interactive)
node scripts/restore-database.js

# Restore specific backup
node scripts/restore-database.js backup-2026-01-29T10-30-00

# Setup automated backups
./scripts/setup-backup-cron.sh

# View backup logs
tail -f logs/backup-cron.log

# List all backups
ls -lh backups/

# Check backup disk usage
du -sh backups/*
```

### Backup Locations

- **Local backups:** `./backups/`
- **Backup logs:** `./logs/backup-cron.log`
- **Scripts:** `./scripts/`

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review backup logs: `cat logs/backup-cron.log`
3. Verify MongoDB connection: `mongosh $MONGODB_URI`
4. Check disk space: `df -h`

---

**Last Updated:** January 29, 2026
