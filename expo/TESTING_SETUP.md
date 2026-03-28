# Testing Setup Guide

## Installation

Install the required testing dependencies:

```bash
bun add -d jest jest-expo @testing-library/react-native @testing-library/jest-native @testing-library/react-hooks @types/jest
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run a specific test file
bun test path/to/test.test.ts
```

## Test Structure

Tests should be placed in `__tests__` directories or named with `.test.ts` or `.spec.ts` suffix:

```
app/
  __tests__/
    index.test.tsx
contexts/
  __tests__/
    AppStateContext.test.tsx
utils/
  validation.test.ts
  sanitization.test.ts
```

## Writing Tests

### Example: Testing a Utility Function

```typescript
// utils/__tests__/sanitization.test.ts
import {
  sanitizeUsername,
  sanitizeDisplayName,
  containsMaliciousPatterns,
} from '../sanitization';

describe('sanitizeUsername', () => {
  it('should remove special characters', () => {
    expect(sanitizeUsername('user@123!')).toBe('user123');
  });

  it('should remove leading/trailing underscores', () => {
    expect(sanitizeUsername('_username_')).toBe('username');
  });

  it('should collapse multiple underscores', () => {
    expect(sanitizeUsername('user___name')).toBe('user_name');
  });
});

describe('containsMaliciousPatterns', () => {
  it('should detect script tags', () => {
    expect(containsMaliciousPatterns('<script>alert("xss")</script>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(containsMaliciousPatterns('javascript:alert(1)')).toBe(true);
  });

  it('should allow safe input', () => {
    expect(containsMaliciousPatterns('Hello World')).toBe(false);
  });
});
```

### Example: Testing a Context

```typescript
// contexts/__tests__/AppStateContext.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { AppStateProvider, useAppState } from '../AppStateContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AppStateProvider>{children}</AppStateProvider>
  </QueryClientProvider>
);

describe('AppStateContext', () => {
  it('should provide user profile', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile.id).toBe('user-me');
  });

  it('should update profile', async () => {
    const { result, waitFor } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.updateProfile.mutate({
        displayName: 'New Name',
      });
    });

    await waitFor(() => result.current.updateProfile.isSuccess);

    expect(result.current.profile.displayName).toBe('New Name');
  });
});
```

### Example: Testing a Component

```typescript
// components/__tests__/ErrorBoundary.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { Text } from 'react-native';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello World</Text>
      </ErrorBoundary>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should render error UI when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/Something went wrong/i)).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should call onError callback', () => {
    const onError = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
```

### Example: Testing with React Query

```typescript
// services/__tests__/user.service.test.ts
import { userService } from '../user.service';

describe('userService', () => {
  it('should get user profile', async () => {
    const profile = await userService.getProfile();

    expect(profile).toBeDefined();
    expect(profile.id).toBe('user-me');
  });

  it('should update profile', async () => {
    const updated = await userService.updateProfile({
      displayName: 'Test User',
    });

    expect(updated.displayName).toBe('Test User');
  });

  it('should create account', async () => {
    const result = await userService.createAccount('testuser', 'password123');

    expect(result.userId).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

## Test Coverage

View coverage report after running `bun test --coverage`:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   75.23 |    68.42 |   72.15 |   75.89 |
 utils              |   95.12 |    92.31 |   94.44 |   95.45 |
  sanitization.ts   |   96.55 |    95.00 |   95.83 |   96.77 | 145,198
  validation.ts     |   93.75 |    89.47 |   92.86 |   94.12 | 89,156
 contexts           |   68.42 |    55.26 |   65.38 |   69.23 |
  AppStateContext   |   72.34 |    60.00 |   70.00 |   73.21 | 89-102,156-178
 components         |   82.14 |    75.00 |   80.00 |   83.33 |
  ErrorBoundary     |   90.00 |    87.50 |   88.89 |   91.67 | 45,67
--------------------|---------|----------|---------|---------|-------------------
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component/function does, not how it does it
   - Test user interactions and outcomes

2. **Keep Tests Simple**
   - One assertion per test (generally)
   - Clear test names describing what is being tested

3. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should sanitize username by removing special characters')

   // Bad
   it('test1')
   ```

4. **Mock External Dependencies**
   - Mock API calls
   - Mock complex modules (camera, location, etc.)
   - Use jest.mock() for consistent mocking

5. **Test Edge Cases**
   ```typescript
   describe('sanitizeUsername', () => {
     it('should handle empty string', () => {
       expect(sanitizeUsername('')).toBe('');
     });

     it('should handle very long input', () => {
       const longString = 'a'.repeat(1000);
       expect(sanitizeUsername(longString)).toBe(longString);
     });
   });
   ```

6. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

## Continuous Integration

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test --coverage
```

## Troubleshooting

### Issue: Tests timing out
**Solution:** Increase timeout in jest.config.js:
```javascript
module.exports = {
  // ...
  testTimeout: 10000, // 10 seconds
};
```

### Issue: Module not found
**Solution:** Check moduleNameMapper in jest.config.js matches your tsconfig.json paths

### Issue: React Native component not rendering
**Solution:** Ensure you're using @testing-library/react-native, not @testing-library/react

## Next Steps

1. Write tests for critical paths (auth, payments, data submission)
2. Add tests for all utility functions
3. Aim for 70%+ code coverage
4. Run tests in CI/CD pipeline
5. Add pre-commit hook to run tests before committing
