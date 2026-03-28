#!/bin/bash

# Nox App Screenshot Organizer
# Automatically organize and rename simulator screenshots

set -e

echo "🎯 Nox Screenshot Organizer"
echo "================================"
echo ""

# Check if screenshots exist
SCREENSHOT_COUNT=$(ls ~/Desktop/Simulator\ Screen\ Shot*.png 2>/dev/null | wc -l | xargs)

if [ "$SCREENSHOT_COUNT" -eq 0 ]; then
    echo "❌ No screenshots found on Desktop"
    echo ""
    echo "To capture screenshots:"
    echo "1. Open the Nox app in Simulator"
    echo "2. Navigate to each screen"
    echo "3. Press Cmd+S to capture"
    echo ""
    exit 1
fi

echo "✅ Found $SCREENSHOT_COUNT screenshot(s)"
echo ""

# Create organized folder structure
SCREENSHOT_DIR="$HOME/Desktop/Nox-Screenshots"
IPHONE_DIR="$SCREENSHOT_DIR/iPhone-6.7"

mkdir -p "$IPHONE_DIR"

echo "📁 Created folder: $IPHONE_DIR"
echo ""

# Move screenshots
mv ~/Desktop/Simulator\ Screen\ Shot*.png "$IPHONE_DIR/"
echo "✅ Moved $SCREENSHOT_COUNT screenshots to organized folder"
echo ""

# List captured screenshots
echo "📸 Captured Screenshots:"
ls -1 "$IPHONE_DIR" | nl
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Review screenshots in: $IPHONE_DIR"
echo "2. Rename them to:"
echo "   - 01-discovery-map.png"
echo "   - 02-live-feed.png"
echo "   - 03-challenges.png"
echo "   - 04-venue-details.png"
echo "   - 05-tickets.png"
echo "   - 06-social.png"
echo "   - 07-profile.png"
echo ""
echo "3. Or run this command to auto-rename (after sorting by capture order):"
echo "   cd '$IPHONE_DIR' && ls -t | tail -r | awk 'BEGIN{names[1]=\"01-discovery-map.png\"; names[2]=\"02-live-feed.png\"; names[3]=\"03-challenges.png\"; names[4]=\"04-venue-details.png\"; names[5]=\"05-tickets.png\"; names[6]=\"06-social.png\"; names[7]=\"07-profile.png\"} {print \"mv \\\"\" \$0 \"\\\" \" names[NR]}' | bash"
echo ""
echo "✅ Screenshots ready for App Store submission!"
