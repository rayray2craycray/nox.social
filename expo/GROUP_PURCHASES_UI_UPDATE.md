# Group Purchases UI Update

## ✅ Changes Made

### 1. Profile Tab Enhancement

Added a **"My Group Purchases"** section to display all group purchases a user has joined or initiated.

**Location:** `/app/(tabs)/profile.tsx`

### Features:

#### Display Information:
- **Venue Name** - Shows which venue the group purchase is for
- **Price Per Person** - Displays the split cost (e.g., "$15.00 per person")
- **Participant Count** - Shows current participants vs max (e.g., "3/5 people")
- **Status Badge** - Color-coded status:
  - 🟢 **Completed** (Green) - Group purchase completed
  - 🔵 **Full** (Blue) - All spots filled
  - 🟠 **Open** (Orange) - Still accepting participants with spots remaining
  - 🔴 **Cancelled** (Red) - Purchase cancelled

#### Visual Elements:
- **Organizer Badge** - Shows "Organizer" badge if user initiated the group purchase
- **Color-coded Icons** - Users icon in cyan blue for easy recognition
- **Compact Cards** - Clean, readable card design matching app style

#### Behavior:
- Shows up to **3 group purchases** by default
- Displays "View All" link if user has more than 3 purchases
- Appears between "My Crews" and "Quick Links" sections
- Only displays if user has joined at least one group purchase

### 2. Added Icons

**Import:** Added `DollarSign` to lucide-react-native imports for price display

### 3. Context Integration

**Hook:** Added `myGroupPurchases` from `useGrowth()` context
- Automatically filters to show only purchases where user is initiator OR participant
- Updates in real-time when user joins new group purchases

### 4. Styles Added

Added 10 new style definitions:
1. `groupPurchaseItem` - Main card container
2. `groupPurchaseIcon` - Icon background circle
3. `groupPurchaseInfo` - Text content area
4. `groupPurchaseName` - Venue name styling
5. `groupPurchaseDetails` - Details container
6. `groupPurchaseDetailItem` - Individual detail row
7. `groupPurchaseDetailText` - Detail text styling
8. `groupPurchaseMeta` - Badge container
9. `initiatorBadge` - "Organizer" badge styling (purple)
10. `statusBadge` & `statusBadgeText` - Status badge styling (dynamic colors)

---

## 📱 User Experience

### When User Joins a Group Purchase:

1. User taps a venue on **Discovery Tab**
2. Scrolls down to see **Group Purchase Opportunities**
3. Taps "Join" on a group purchase
4. Returns to **Profile Tab**
5. New section appears: **"My Group Purchases"**
6. Shows the newly joined purchase with:
   - Venue name
   - Split cost amount
   - Current participant count
   - Status (e.g., "2 spots left")

### Example Display:

```
MY GROUP PURCHASES
┌──────────────────────────────────────┐
│ 👥  Pulse Nightclub                  │
│     💵 $15.00 per person             │
│     👥 3/5 people                     │
│     [Organizer] [2 spots left]       │
└──────────────────────────────────────┘
```

---

## 🎯 Status Indicators

| Status | Color | Description |
|--------|-------|-------------|
| **Open** | 🟠 Orange | Accepting participants, shows spots remaining |
| **Full** | 🔵 Blue | All spots filled, awaiting completion |
| **Completed** | 🟢 Green | Purchase completed successfully |
| **Cancelled** | 🔴 Red | Purchase was cancelled |

---

## 🔄 Integration Points

- **GrowthContext:** Uses `myGroupPurchases` computed value
- **Mock Data:** Pulls venue names from `mockVenues`
- **Haptics:** Light haptic feedback on "View All" tap
- **Router:** Ready for navigation to full list view

---

## ✨ Future Enhancements

1. Tap on group purchase card to view details
2. "View All" navigation to full purchases list
3. Pull-to-refresh to update purchase status
4. Push notifications when purchase becomes full/completed
5. Share group purchase link with friends

---

**Status:** ✅ Fully Implemented and Integrated
**Location:** Profile Tab, between "My Crews" and "Quick Links" sections
