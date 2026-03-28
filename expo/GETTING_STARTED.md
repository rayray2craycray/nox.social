# Getting Started with Improvements

Quick start guide for using all the new improvements made to your Rork Nightlife App.

## 1. Install Dependencies

First, install the new dependencies:

```bash
# Install Zod for validation
bun add zod

# Install testing dependencies
bun add -d jest jest-expo @testing-library/react-native @testing-library/jest-native @testing-library/react-hooks @types/jest
```

## 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your actual project ID (it's already populated with the current one from your package.json):

```env
RORK_PROJECT_ID=your_actual_project_id_here
```

## 3. Run Tests

Verify the testing setup works:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

Expected output:
```
PASS utils/__tests__/sanitization.test.ts
PASS components/__tests__/ErrorBoundary.test.tsx
PASS services/__tests__/user.service.test.ts
PASS services/__tests__/venues.service.test.ts

Test Suites: 4 passed, 4 total
Tests:       50 passed, 50 total
```

## 4. Start the App

Start your app normally:

```bash
bun start
```

The app should start with no errors. All functionality remains the same, but the code is now more secure and maintainable.

## 5. Using the New Components

### Using Studio Components

The large studio.tsx file has been split into reusable components. To use them:

```typescript
import {
  StatsCard,
  GigCard,
  FilterSelector,
  StickerSelector,
  VideoTrimmer,
} from '@/app/(tabs)/studio';

// Use in your components
<StatsCard
  icon={<DollarSign size={24} color="#ffffff" />}
  label="Total Earnings"
  value="$12,450"
/>

<GigCard
  gig={upcomingGig}
  onPress={() => handleGigPress(upcomingGig)}
  formatDate={(date) => new Date(date).toLocaleDateString()}
  formatCurrency={(amount) => `$${amount.toLocaleString()}`}
/>
```

### Using Settings Components

Similarly for settings:

```typescript
import {
  SettingRow,
  SettingSection,
  LinkedCardItem,
} from '@/app/settings';

<SettingSection title="Account">
  <SettingRow
    icon={<Bell size={20} color={COLORS.accent} />}
    label="Notifications"
    onPress={() => router.push('/notifications')}
  />
</SettingSection>
```

## 6. Using Validation

Add validation to your forms:

```typescript
import { createAccountSchema, safeValidateData } from '@/utils/validation';
import { sanitizeInput } from '@/utils/sanitization';

function handleSignup(username: string, password: string) {
  // Step 1: Sanitize
  const sanitizedUsername = sanitizeInput(username, 'username');

  // Step 2: Validate
  const result = safeValidateData(createAccountSchema, {
    username: sanitizedUsername,
    password,
  });

  if (!result.success) {
    // Show errors to user
    console.error(formatValidationErrors(result.errors));
    return;
  }

  // Step 3: Use validated data
  createAccount(result.data);
}
```

## 7. Using the API Service Layer

Replace direct mock imports with service calls:

```typescript
// OLD WAY (Don't do this)
import { mockVenues } from '@/mocks/venues';
const venues = mockVenues;

// NEW WAY (Do this)
import { venuesService } from '@/services';
const venues = await venuesService.getVenues();
```

The service layer automatically uses mock data in development and can easily switch to real API calls in production.

## 8. Performance Best Practices

When creating new components, follow these patterns:

```typescript
import React, { memo, useMemo, useCallback } from 'react';

// Memoize the component
export const MyComponent = memo<MyComponentProps>(({ data, onPress }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  // Memoize callbacks
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <View>
      {/* Your JSX */}
    </View>
  );
});
```

## 9. Common Tasks

### Running Lint
```bash
bun run lint
```

### Running Tests for Specific File
```bash
bun test utils/sanitization.test.ts
```

### Viewing Test Coverage
```bash
bun test --coverage
# Open coverage/lcov-report/index.html in browser
```

### Checking for Type Errors
```bash
tsc --noEmit
```

## 10. What Changed vs What Stayed the Same

### What Changed (Under the Hood)
- Environment variables now used for secrets
- Input validation available but not yet integrated
- Components split into smaller, reusable pieces
- Performance optimizations applied
- Testing infrastructure added
- API service layer created

### What Stayed the Same (User Experience)
- ✅ All screens work identically
- ✅ All features function the same
- ✅ No breaking changes
- ✅ No UI changes
- ✅ Mock data still works

## 11. Integration Checklist

To fully integrate the improvements into your app:

- [ ] Update studio.tsx to import and use new components
- [ ] Update settings.tsx to import and use new components
- [ ] Add validation to all form inputs
- [ ] Add sanitization to all user text inputs
- [ ] Replace direct mock imports with service layer calls
- [ ] Write tests for your custom components
- [ ] Add error tracking (Sentry/Bugsnag)
- [ ] Implement real Toast POS OAuth

## 12. Documentation

All improvements are documented:

- `IMPROVEMENTS.md` - Overview of all changes
- `TESTING_SETUP.md` - How to write and run tests
- `PERFORMANCE.md` - Performance optimization guide
- `utils/README.md` - Validation & sanitization guide
- `app/(tabs)/studio/README.md` - Studio components guide
- `app/settings/README.md` - Settings components guide
- `FINAL_SUMMARY.md` - Complete summary

## 13. Troubleshooting

### Tests failing with "Cannot find module"
- Ensure all dependencies are installed: `bun install`
- Check that jest.config.js moduleNameMapper matches tsconfig.json

### App won't start
- Verify .env file exists and has RORK_PROJECT_ID set
- Try clearing cache: `bun start --clear`

### TypeScript errors
- Run `bun install` to ensure types are up to date
- Check imports are correct (using @/ alias)

### Performance not improved
- Ensure you're using the memoized components
- Check React DevTools Profiler to identify bottlenecks
- Review PERFORMANCE.md for optimization techniques

## 14. Next Steps

1. ✅ Install dependencies (above)
2. ✅ Configure .env
3. ✅ Run tests to verify setup
4. ⏳ Integrate components into main files
5. ⏳ Add validation to forms
6. ⏳ Replace mock imports with services
7. ⏳ Write tests for your components
8. ⏳ Performance test with production data
9. ⏳ Security audit
10. ⏳ Deploy to production

## Support

If you encounter issues:
1. Check the relevant documentation file
2. Review example tests for patterns
3. Check the component README files
4. Verify all dependencies are installed

Happy coding! 🚀
