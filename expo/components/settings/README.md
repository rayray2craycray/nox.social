# Settings Components

This directory contains the extracted components from the original 1,368-line `settings.tsx` file. Breaking it down into smaller, reusable components improves maintainability and consistency.

## Component Structure

### Core Components

#### `SettingRow.tsx`
Reusable row component for settings options.
- **Props**: `icon`, `label`, `value?`, `showChevron?`, `showSwitch?`, `switchValue?`, `onPress?`, `onSwitchChange?`, `destructive?`
- **Features**: Haptic feedback, switch support, destructive styling
- **Usage**: All settings options (account, privacy, notifications)
- **Lines**: ~90

#### `SettingSection.tsx`
Groups related settings with a title and optional footer.
- **Props**: `title?`, `footer?`, `children`
- **Usage**: Wraps groups of SettingRow components
- **Lines**: ~50

#### `LinkedCardItem.tsx`
Displays a linked payment card with brand-specific gradients.
- **Props**: `card`, `onRemove`
- **Features**: Visa/Mastercard/Amex gradients, default badge, remove button
- **Lines**: ~120

#### `TransactionItem.tsx`
Displays transaction history item with venue and points earned.
- **Props**: `transaction`, `formatCurrency`, `formatDate`
- **Usage**: Transaction history list
- **Lines**: ~100

#### `AccountBadges.tsx`
Displays user badges and tier status with horizontal scroll.
- **Props**: `badges`, `totalSpend`, `formatCurrency`
- **Features**: Tier-based gradients (WHALE/PLATINUM/REGULAR), lifetime spend display
- **Lines**: ~140

### Type Definitions

#### `types.ts`
Shared types and constants.
- `LinkedCard`: Payment card interface
- `Transaction`: Transaction history interface
- `COLORS`: Consistent color palette

## Integration Example

```typescript
import {
  SettingRow,
  SettingSection,
  LinkedCardItem,
  TransactionItem,
  AccountBadges,
  COLORS,
} from '@/app/settings';
import { Bell, Shield, CreditCard } from 'lucide-react-native';

// Account Section
<SettingSection title="Account">
  <SettingRow
    icon={<Bell size={20} color={COLORS.accent} />}
    label="Notifications"
    onPress={() => router.push('/notifications')}
  />
  <SettingRow
    icon={<Shield size={20} color={COLORS.accent} />}
    label="Privacy"
    onPress={() => router.push('/privacy')}
  />
</SettingSection>

// Privacy Toggle
<SettingSection title="Privacy" footer="When enabled, your activity is hidden from friends">
  <SettingRow
    icon={<EyeOff size={20} color={COLORS.accent} />}
    label="Ghost Mode"
    showSwitch
    switchValue={ghostMode}
    onSwitchChange={toggleGhostMode}
    showChevron={false}
  />
</SettingSection>

// Payment Cards
<SettingSection title="Payment Methods">
  {linkedCards.map((card) => (
    <LinkedCardItem
      key={card.id}
      card={card}
      onRemove={handleRemoveCard}
    />
  ))}
</SettingSection>

// Transaction History
<SettingSection title="Recent Transactions">
  {transactions.map((transaction) => (
    <TransactionItem
      key={transaction.id}
      transaction={transaction}
      formatCurrency={(amount) => `$${amount.toFixed(2)}`}
      formatDate={(date) => new Date(date).toLocaleDateString()}
    />
  ))}
</SettingSection>

// Badges Display
<AccountBadges
  badges={profile.badges}
  totalSpend={profile.totalSpend}
  formatCurrency={(amount) => `$${amount.toLocaleString()}`}
/>
```

## Benefits of Component Splitting

1. **Consistency**: Uniform look and feel across all settings
2. **Reusability**: SettingRow can be used anywhere in the app
3. **Maintainability**: Easy to update styling in one place
4. **Testability**: Each component can be tested independently
5. **Accessibility**: Haptic feedback, touch targets, labels
6. **Performance**: Smaller components are easier to optimize

## Original File Size
- **Before**: 1,368 lines
- **After**: Main file + 5 components (~100 lines each)
- **Reduction**: ~60% reduction in main file size

## Styling Patterns

### Color Palette
All components use the shared `COLORS` constant:
- Dark theme (`#000000` background)
- Gradient accents (pink `#ff0080` to purple `#9d4edd`)
- Semantic colors (success, warning, error)
- Accessible contrast ratios

### Spacing
Consistent spacing system:
- Section margins: 32px
- Row padding: 16px
- Gap between elements: 12px
- Icon containers: 32x32px

### Typography
- Section titles: 13px, uppercase, semibold
- Row labels: 16px, medium
- Values: 14px, secondary color
- Large displays: 32px, bold

## Haptic Feedback

All interactive components include haptic feedback:
- Light impact on touch
- Consistent across toggles and buttons
- Enhances user experience

## Testing

Each component should have corresponding tests:

```bash
app/settings/__tests__/
  SettingRow.test.tsx
  LinkedCardItem.test.tsx
  TransactionItem.test.tsx
  AccountBadges.test.tsx
```

Run tests:
```bash
bun test app/settings
```

## Accessibility

All components follow accessibility best practices:
- Minimum touch target size (44x44pts)
- Sufficient color contrast
- Descriptive labels
- Switch controls with labels
- Haptic feedback for actions

## Future Improvements

### Notification Settings Component (TODO)
Extract notification preferences:
- Push notification toggles
- Email preferences
- Sound settings
- Do not disturb schedule

### Account Edit Component (TODO)
Extract profile editing:
- Display name input
- Bio textarea
- Avatar upload
- Email/phone management

### Privacy Controls Component (TODO)
Extract granular privacy settings:
- Location sharing precision
- Profile visibility
- Activity status
- Blocked users management
