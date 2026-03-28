# Validation & Sanitization Utilities

## Installation

```bash
bun add zod
```

## Usage Examples

### 1. Validating User Profile Updates

```typescript
import { updateProfileSchema, safeValidateData } from '@/utils/validation';
import { sanitizeInput } from '@/utils/sanitization';

function handleProfileUpdate(displayName: string, bio: string) {
  // Step 1: Sanitize inputs
  const sanitizedDisplayName = sanitizeInput(displayName, 'displayName');
  const sanitizedBio = sanitizeInput(bio, 'bio');

  // Step 2: Validate with Zod
  const result = safeValidateData(updateProfileSchema, {
    displayName: sanitizedDisplayName,
    bio: sanitizedBio,
  });

  if (!result.success) {
    const errors = formatValidationErrors(result.errors);
    console.error('Validation failed:', errors);
    return { error: errors };
  }

  // Step 3: Use validated data
  return updateProfile(result.data);
}
```

### 2. Validating Authentication

```typescript
import { createAccountSchema } from '@/utils/validation';
import { sanitizeInput } from '@/utils/sanitization';

function handleSignup(username: string, password: string) {
  // Sanitize username
  const sanitizedUsername = sanitizeInput(username, 'username');

  // Validate (password doesn't need sanitization as it's hashed)
  try {
    const validated = createAccountSchema.parse({
      username: sanitizedUsername,
      password,
    });

    return createAccount(validated.username, validated.password);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: formatValidationErrors(error) };
    }
    throw error;
  }
}
```

### 3. Validating Vibe Checks

```typescript
import { vibeCheckSchema } from '@/utils/validation';

function submitVibeCheck(data: unknown) {
  // Validate the entire object at once
  const validated = vibeCheckSchema.parse(data);

  return submitVibeCheckMutation(validated);
}
```

### 4. Checking for Malicious Input

```typescript
import { containsMaliciousPatterns, sanitizeTextInput } from '@/utils/sanitization';

function handleTextInput(value: string) {
  // First check for obviously malicious patterns
  if (containsMaliciousPatterns(value)) {
    console.warn('Malicious input detected');
    return '';
  }

  // Sanitize for React Native
  return sanitizeTextInput(value);
}
```

## Security Best Practices

### Always Sanitize THEN Validate

```typescript
// ✅ CORRECT
const sanitized = sanitizeInput(userInput, 'displayName');
const validated = displayNameSchema.parse(sanitized);

// ❌ WRONG
const validated = displayNameSchema.parse(userInput); // Could contain malicious chars
const sanitized = sanitizeInput(validated, 'displayName'); // Too late
```

### Use Parameterized Queries (Not string sanitization)

```typescript
// ✅ CORRECT - Parameterized query (if using SQL)
db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ WRONG - String concatenation
db.query(`SELECT * FROM users WHERE id = '${escapeSql(userId)}'`);
```

### Validate on Both Client and Server

```typescript
// Client-side validation (better UX)
const clientResult = safeValidateData(schema, data);
if (!clientResult.success) {
  showErrors(clientResult.errors);
  return;
}

// Server-side validation (security)
// Always validate again on the server - never trust client
```

### Store Sensitive Data Securely

```typescript
import * as SecureStore from 'expo-secure-store';

// ✅ CORRECT - Use SecureStore for tokens
await SecureStore.setItemAsync('access_token', token);

// ❌ WRONG - AsyncStorage is not encrypted
await AsyncStorage.setItem('access_token', token);
```

## Common Pitfalls

1. **Don't rely solely on client-side validation** - Always validate on the server
2. **Don't use regex for HTML sanitization** - Use a proper library like DOMPurify (web) or the utilities provided
3. **Don't trust file uploads** - Validate file types, scan for malware, limit sizes
4. **Don't store passwords in plain text** - Always hash with bcrypt/argon2
5. **Don't log sensitive data** - Sanitize logs to remove tokens, passwords, PII

## Integration with React Hook Form (Optional)

If using React Hook Form, you can integrate Zod directly:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { updateProfileSchema } from '@/utils/validation';

function ProfileForm() {
  const { handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(updateProfileSchema),
  });

  return (
    // Your form JSX
  );
}
```
