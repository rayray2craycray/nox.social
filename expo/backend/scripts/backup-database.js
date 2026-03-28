#!/usr/bin/env node

/**
 * MongoDB Backup Script
 * Creates timestamped backups of the MongoDB database
 *
 * Usage:
 *   node scripts/backup-database.js
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string
 *   BACKUP_DIR - Directory to store backups (default: ./backups)
 *   BACKUP_RETENTION_DAYS - Days to keep backups (default: 30)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const MONGODB_URI = process.env.MONGODB_URI;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let size = 0;

  if (!fs.existsSync(dirPath)) {
    return size;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

async function createBackup() {
  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║           MongoDB Database Backup                          ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    // Validate MongoDB URI
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      log(`\n✅ Created backup directory: ${BACKUP_DIR}`, 'green');
    }

    // Generate timestamp for backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    log(`\n📦 Starting backup...`, 'cyan');
    log(`   Database: ${MONGODB_URI.split('@')[1] || 'localhost'}`, 'cyan');
    log(`   Backup location: ${backupPath}`, 'cyan');

    // Parse MongoDB URI to get database name
    const dbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'nox-nightlife';

    // Create mongodump command
    const mongodumpCmd = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;

    // Execute mongodump
    await new Promise((resolve, reject) => {
      exec(mongodumpCmd, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });

    // Get backup size
    const backupSize = getDirectorySize(backupPath);

    log(`\n✅ Backup completed successfully!`, 'green');
    log(`   Size: ${formatBytes(backupSize)}`, 'green');
    log(`   Location: ${backupPath}`, 'green');

    // Clean up old backups
    await cleanupOldBackups();

    return backupPath;

  } catch (error) {
    log(`\n❌ Backup failed: ${error.message}`, 'red');

    if (error.message.includes('mongodump')) {
      log('\n⚠️  mongodump not found. Please install MongoDB Database Tools:', 'yellow');
      log('   macOS: brew install mongodb-database-tools', 'yellow');
      log('   Ubuntu: sudo apt-get install mongodb-database-tools', 'yellow');
      log('   Or download from: https://www.mongodb.com/try/download/database-tools', 'yellow');
    }

    throw error;
  }
}

async function cleanupOldBackups() {
  try {
    log(`\n🧹 Cleaning up old backups (retention: ${RETENTION_DAYS} days)...`, 'cyan');

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    const cutoffTime = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    let reclaimedSpace = 0;

    for (const backup of backups) {
      if (backup.time < cutoffTime) {
        const size = getDirectorySize(backup.path);
        fs.rmSync(backup.path, { recursive: true, force: true });
        deletedCount++;
        reclaimedSpace += size;
        log(`   Deleted: ${backup.name}`, 'yellow');
      }
    }

    if (deletedCount > 0) {
      log(`\n✅ Deleted ${deletedCount} old backup(s)`, 'green');
      log(`   Reclaimed space: ${formatBytes(reclaimedSpace)}`, 'green');
    } else {
      log(`   No old backups to delete`, 'green');
    }

    // Show backup statistics
    const remainingBackups = backups.filter(b => b.time >= cutoffTime);
    const totalBackupSize = remainingBackups.reduce((sum, b) => sum + getDirectorySize(b.path), 0);

    log(`\n📊 Backup Statistics:`, 'blue');
    log(`   Total backups: ${remainingBackups.length}`, 'cyan');
    log(`   Total size: ${formatBytes(totalBackupSize)}`, 'cyan');
    log(`   Oldest backup: ${remainingBackups.length > 0 ? new Date(remainingBackups[remainingBackups.length - 1].time).toLocaleString() : 'N/A'}`, 'cyan');

  } catch (error) {
    log(`\n⚠️  Cleanup warning: ${error.message}`, 'yellow');
  }
}

// Run backup if executed directly
if (require.main === module) {
  createBackup()
    .then(() => {
      log('\n✅ Backup process completed\n', 'green');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createBackup, cleanupOldBackups };
