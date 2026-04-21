# Studio Components

This directory contains the extracted components from the original 2,516-line `studio.tsx` file. Breaking it down into smaller, reusable components improves maintainability and testability.

## Component Structure

### Core Components

#### `StatsCard.tsx`
Displays analytics statistics in a card format.
- **Props**: `icon`, `label`, `value`, `subtitle?`
- **Usage**: Analytics dashboard, earnings display
- **Lines**: ~80

#### `GigCard.tsx`
Displays gig information in a card format.
- **Props**: `gig`, `onPress`, `formatDate`, `formatCurrency`
- **Usage**: Upcoming/completed gigs lists
- **Lines**: ~140

#### `FilterSelector.tsx`
Video filter selection with horizontal scroll.
- **Props**: `selectedFilter`, `onSelectFilter`
- **Filters**: Neon Glitch, Afterhours Noir, VHS Retro, Cyber Wave, Golden Hour
- **Lines**: ~120

#### `StickerSelector.tsx`
Call-to-action sticker selection.
- **Props**: `selectedSticker`, `onSelectSticker`
- **Stickers**: Get Tickets, Join Lobby, Live Tonight, Swipe Up
- **Lines**: ~110

#### `VideoTrimmer.tsx`
Video trimming with dual sliders for start/end points.
- **Props**: `trimStart`, `trimEnd`, `videoDuration`, `onTrimStartChange`, `onTrimEndChange`
- **Features**: Duration validation (10-15s), real-time preview
- **Lines**: ~140

### Type Definitions

#### `types.ts`
Shared types and constants across studio components.
- `PromoStep`: Video creation flow steps
- `SafeZoneType`: Social media safe zones
- `VibeFilter`: Available video filters
- `StickerType`: Available CTA stickers
- `COLORS`: Consistent color palette

## Integration Example

```typescript
import {
  StatsCard,
  GigCard,
  FilterSelector,
  StickerSelector,
  VideoTrimmer,
  COLORS,
} from '@/app/(tabs)/studio';

// In your main studio screen
<StatsCard
  icon={<DollarSign size={24} color="#ffffff" />}
  label="Total Earnings"
  value="$12,450"
  subtitle="+15% this month"
/>

<GigCard
  gig={upcomingGig}
  onPress={() => handleGigPress(upcomingGig)}
  formatDate={(date) => new Date(date).toLocaleDateString()}
  formatCurrency={(amount) => `$${amount.toLocaleString()}`}
/>

<FilterSelector
  selectedFilter={selectedFilter}
  onSelectFilter={setSelectedFilter}
/>

<VideoTrimmer
  trimStart={trimStart}
  trimEnd={trimEnd}
  videoDuration={15}
  onTrimStartChange={setTrimStart}
  onTrimEndChange={setTrimEnd}
/>
```

## Benefits of Component Splitting

1. **Maintainability**: Easier to find and modify specific functionality
2. **Testability**: Each component can be tested independently
3. **Reusability**: Components can be used in other parts of the app
4. **Performance**: Smaller components can be optimized individually with React.memo
5. **Code Review**: Smaller files are easier to review
6. **Developer Experience**: Better IDE performance with smaller files

## Original File Size
- **Before**: 2,516 lines
- **After**: Main file + 5 components (~400 lines each)
- **Reduction**: ~80% reduction in main file size

## Future Improvements

### Camera Controls Component (TODO)
Extract camera recording logic:
- Camera permission handling
- Recording controls (start/stop/pause)
- Countdown timer
- Flash and camera flip controls
- Recording duration tracking

### Video Preview Component (TODO)
Extract video preview and playback:
- Video player controls
- Play/pause functionality
- Seek controls
- Safe zone overlays

### Share Modal Component (TODO)
Extract sharing functionality:
- Platform selection (Instagram, TikTok, etc.)
- Direct share to platforms
- Copy link functionality
- Save to gallery

## Testing

Each component has or should have corresponding tests:

```bash
app/(tabs)/studio/__tests__/
  StatsCard.test.tsx
  GigCard.test.tsx
  FilterSelector.test.tsx
  StickerSelector.test.tsx
  VideoTrimmer.test.tsx
```

Run tests:
```bash
bun test app/(tabs)/studio
```

## Styling

All components use the shared `COLORS` constant from `types.ts` to maintain visual consistency:
- Dark theme optimized
- Gradient accents
- Consistent spacing (12px grid system)
- Accessible contrast ratios
