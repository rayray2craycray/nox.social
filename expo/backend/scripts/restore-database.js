#!/usr/bin/env node

/**
 * MongoDB Restore Script
 * Restores database from a backup
 *
 * Usage:
 *   node scripts/restore-database.js <backup-name>
 *   node scripts/restore-database.js                    # Interactive mode - lists available backups
 *
 * Example:
 *   node scripts/restore-database.js backup-2026-01-28T10-30-00
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string
 *   BACKUP_DIR - Directory where backups are stored (default: ./backups)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
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

function getAvailableBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      date: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      size: getDirectorySize(path.join(BACKUP_DIR, file))
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function selectBackup() {
  const backups = getAvailableBackups();

  if (backups.length === 0) {
    throw new Error('No backups found in ' + BACKUP_DIR);
  }

  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║           Available Backups                                ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  backups.forEach((backup, index) => {
    log(`\n${index + 1}. ${backup.name}`, 'cyan');
    log(`   Date: ${backup.date.toLocaleString()}`, 'cyan');
    log(`   Size: ${formatBytes(backup.size)}`, 'cyan');
  });

  const answer = await promptUser('\nSelect backup number (or press Enter for most recent): ');

  if (!answer.trim()) {
    return backups[0];
  }

  const index = parseInt(answer, 10) - 1;

  if (isNaN(index) || index < 0 || index >= backups.length) {
    throw new Error('Invalid backup selection');
  }

  return backups[index];
}

async function confirmRestore() {
  log('\n⚠️  WARNING: This will REPLACE your current database!', 'yellow');
  log('   All current data will be lost.', 'yellow');

  const answer = await promptUser('\nAre you sure you want to continue? (yes/no): ');

  return answer.toLowerCase() === 'yes';
}

async function restoreBackup(backupName) {
  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║           MongoDB Database Restore                         ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    // Validate MongoDB URI
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // If no backup name provided, show interactive selection
    let backup;
    if (!backupName) {
      backup = await selectBackup();
    } else {
      const backupPath = path.join(BACKUP_DIR, backupName);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup not found: ${backupPath}`);
      }

      backup = {
        name: backupName,
        path: backupPath,
        date: fs.statSync(backupPath).mtime,
        size: getDirectorySize(backupPath)
      };
    }

    log(`\n📦 Selected backup:`, 'cyan');
    log(`   Name: ${backup.name}`, 'cyan');
    log(`   Date: ${backup.date.toLocaleString()}`, 'cyan');
    log(`   Size: ${formatBytes(backup.size)}`, 'cyan');

    // Confirm restore
    const confirmed = await confirmRestore();

    if (!confirmed) {
      log('\n❌ Restore cancelled', 'yellow');
      return;
    }

    // Parse MongoDB URI to get database name
    const dbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'nox-nightlife';

    log(`\n📥 Starting restore...`, 'cyan');
    log(`   Target database: ${dbName}`, 'cyan');

    // Create mongorestore command
    // --drop flag drops existing collections before restoring
    const mongorestoreCmd = `mongorestore --uri="${MONGODB_URI}" --drop "${backup.path}"`;

    // Execute mongorestore
    await new Promise((resolve, reject) => {
      exec(mongorestoreCmd, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });

    log(`\n✅ Database restored successfully!`, 'green');
    log(`   Restored from: ${backup.name}`, 'green');
    log(`   Date: ${backup.date.toLocaleString()}`, 'green');

  } catch (error) {
    log(`\n❌ Restore failed: ${error.message}`, 'red');

    if (error.message.includes('mongorestore')) {
      log('\n⚠️  mongorestore not found. Please install MongoDB Database Tools:', 'yellow');
      log('   macOS: brew install mongodb-database-tools', 'yellow');
      log('   Ubuntu: sudo apt-get install mongodb-database-tools', 'yellow');
      log('   Or download from: https://www.mongodb.com/try/download/database-tools', 'yellow');
    }

    throw error;
  }
}

// Run restore if executed directly
if (require.main === module) {
  const backupName = process.argv[2];

  restoreBackup(backupName)
    .then(() => {
      log('\n✅ Restore process completed\n', 'green');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { restoreBackup, getAvailableBackups };
