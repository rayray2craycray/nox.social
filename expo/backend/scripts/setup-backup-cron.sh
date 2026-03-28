#!/bin/bash

###############################################################################
# Setup Automated Database Backup Cron Job
#
# This script sets up a cron job to automatically backup the database
#
# Usage:
#   chmod +x scripts/setup-backup-cron.sh
#   ./scripts/setup-backup-cron.sh
#
# The cron job will run daily at 2 AM
###############################################################################

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the absolute path to the backend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Setup Automated Database Backups                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}   Please install Node.js first${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}❌ .env file not found in $BACKEND_DIR${NC}"
    echo -e "${YELLOW}   Please create .env file with MONGODB_URI${NC}"
    exit 1
fi

# Check if mongodump is installed
if ! command -v mongodump &> /dev/null; then
    echo -e "${YELLOW}⚠️  mongodump is not installed${NC}"
    echo -e "${YELLOW}   Backups will fail until MongoDB Database Tools are installed${NC}"
    echo ""
    echo -e "${CYAN}   Installation options:${NC}"
    echo -e "${CYAN}   macOS: brew install mongodb-database-tools${NC}"
    echo -e "${CYAN}   Ubuntu: sudo apt-get install mongodb-database-tools${NC}"
    echo -e "${CYAN}   Or download from: https://www.mongodb.com/try/download/database-tools${NC}"
    echo ""
fi

# Create log directory
LOG_DIR="$BACKEND_DIR/logs"
mkdir -p "$LOG_DIR"

# Cron job command
CRON_COMMAND="cd $BACKEND_DIR && /usr/bin/env node $BACKEND_DIR/scripts/backup-database.js >> $LOG_DIR/backup-cron.log 2>&1"

# Cron schedule (daily at 2 AM)
CRON_SCHEDULE="0 2 * * *"

# Full cron job
CRON_JOB="$CRON_SCHEDULE $CRON_COMMAND"

echo -e "${CYAN}📋 Cron Job Configuration:${NC}"
echo -e "${CYAN}   Schedule: Daily at 2:00 AM${NC}"
echo -e "${CYAN}   Command: $CRON_COMMAND${NC}"
echo -e "${CYAN}   Log file: $LOG_DIR/backup-cron.log${NC}"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-database.js"; then
    echo -e "${YELLOW}⚠️  A backup cron job already exists${NC}"
    echo ""
    read -p "Do you want to replace it? (yes/no): " replace

    if [ "$replace" != "yes" ]; then
        echo -e "${YELLOW}❌ Setup cancelled${NC}"
        exit 0
    fi

    # Remove existing backup cron job
    (crontab -l 2>/dev/null | grep -v "backup-database.js") | crontab -
    echo -e "${GREEN}✅ Removed existing cron job${NC}"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cron job added successfully!${NC}"
    echo ""
    echo -e "${CYAN}📊 Current cron jobs:${NC}"
    crontab -l | grep "backup-database.js"
    echo ""
    echo -e "${CYAN}💡 Useful commands:${NC}"
    echo -e "${CYAN}   View all cron jobs:    crontab -l${NC}"
    echo -e "${CYAN}   Edit cron jobs:        crontab -e${NC}"
    echo -e "${CYAN}   Remove all cron jobs:  crontab -r${NC}"
    echo -e "${CYAN}   View backup logs:      tail -f $LOG_DIR/backup-cron.log${NC}"
    echo -e "${CYAN}   Manual backup:         node $BACKEND_DIR/scripts/backup-database.js${NC}"
    echo ""
    echo -e "${GREEN}🎉 Automated backups are now configured!${NC}"
    echo -e "${GREEN}   Backups will run daily at 2:00 AM${NC}"
else
    echo -e "${RED}❌ Failed to add cron job${NC}"
    exit 1
fi
