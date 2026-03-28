# Frontend Validation Implementation Guide

## Overview
Enhanced real-time input validation for business registration with visual feedback using Zod schemas.

## Changes Made

### 1. Enhanced Validation Schemas (`/utils/validation.ts`)

✅ **Added Business Registration Schemas:**
- `venueNameSchema` - 2-100 characters, matches backend
- `businessEmailSchema` - Email with typo detection
- `phoneSchema` - 10-15 digits, optional
- `websiteSchema` - Must include http:// or https://
- `zipCodeSchema` - 5 or 9 digit format
- `businessRegistrationStep1Schema` - Step 1 validation
- `businessRegistrationStep2Schema` - Step 2 validation

**Key Features:**
- Typo detection for common email domains (gmial.com → gmail.com)
- Phone number length validation (10-15 digits)
- URL protocol requirement (http:// or https://)
- ZIP code format validation (12345 or 12345-6789)

---

## Implementation Steps for `/app/business/register.tsx`

### Step 1: Import Zod Schemas

Add to imports at top of file:
```typescript
import {
  businessRegistrationStep1Schema,
  businessRegistrationStep2Schema,
  safeValidateData,
} from '@/utils/validation';
import { Check, X } from 'lucide-react-native';
```

### Step 2: Add Real-Time Validation State

Add after existing state declarations:
```typescript
const [fieldStatus, setFieldStatus] = useState<Record<string, 'valid' | 'invalid' | 'neutral'>>({});
const [touched, setTouched] = useState<Record<string, boolean>>({});
```

### Step 3: Create Real-Time Validation Function

Add this function before `validateStep1`:
```typescript
const validateField = (fieldName: string, value: any) => {
  try {
    if (fieldName === 'venueName') {
      venueNameSchema.parse(value);
      setFieldStatus(prev => ({ ...prev, venueName: 'valid' }));
      setErrors(prev => ({ ...prev, venueName: '' }));
    } else if (fieldName === 'businessEmail') {
      businessEmailSchema.parse(value);
      setFieldStatus(prev => ({ ...prev, businessEmail: 'valid' }));
      setErrors(prev => ({ ...prev, businessEmail: '' }));
    } else if (fieldName === 'phone') {
      if (value) {
        phoneSchema.parse(value);
        setFieldStatus(prev => ({ ...prev, phone: 'valid' }));
      } else {
        setFieldStatus(prev => ({ ...prev, phone: 'neutral' }));
      }
      setErrors(prev => ({ ...prev, phone: '' }));
    } else if (fieldName === 'website') {
      if (value) {
        websiteSchema.parse(value);
        setFieldStatus(prev => ({ ...prev, website: 'valid' }));
      } else {
        setFieldStatus(prev => ({ ...prev, website: 'neutral' }));
      }
      setErrors(prev => ({ ...prev, website: '' }));
    } else if (fieldName === 'zipCode') {
      zipCodeSchema.parse(value);
      setFieldStatus(prev => ({ ...prev, zipCode: 'valid' }));
      setErrors(prev => ({ ...prev, zipCode: '' }));
    }
  } catch (error: any) {
    setFieldStatus(prev => ({ ...prev, [fieldName]: 'invalid' }));
    if (error.errors?.[0]?.message) {
      setErrors(prev => ({ ...prev, [fieldName]: error.errors[0].message }));
    }
  }
};
```

### Step 4: Update `validateStep1` to Use Zod

Replace the existing `validateStep1` function:
```typescript
const validateStep1 = (): boolean => {
  const result = safeValidateData(businessRegistrationStep1Schema, {
    venueName: formData.venueName,
    businessEmail: formData.businessEmail,
    businessType: formData.businessType,
  });

  if (!result.success) {
    const newErrors: Record<string, string> = {};
    result.errors.errors.forEach(err => {
      const field = err.path[0] as string;
      newErrors[field] = err.message;
      setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
    });
    setErrors(newErrors);
    return false;
  }

  return true;
};
```

### Step 5: Update `validateStep2` to Use Zod

Replace the existing `validateStep2` function:
```typescript
const validateStep2 = (): boolean => {
  const result = safeValidateData(businessRegistrationStep2Schema, {
    location: formData.location,
    phone: formData.phone,
    website: formData.website,
    description: formData.description,
  });

  if (!result.success) {
    const newErrors: Record<string, string> = {};
    result.errors.errors.forEach(err => {
      const field = err.path.join('.');
      const displayField = field.replace('location.', '');
      newErrors[displayField] = err.message;
      setFieldStatus(prev => ({ ...prev, [displayField]: 'invalid' }));
    });
    setErrors(newErrors);
    return false;
  }

  return true;
};
```

### Step 6: Add Visual Feedback Icons

Update the venue name input to include validation icon:
```typescript
<View style={[
  styles.inputContainer,
  errors.venueName && styles.inputError,
  fieldStatus.venueName === 'valid' && styles.inputValid,
]}>
  <Building2 size={20} color={COLORS.textSecondary} />
  <TextInput
    style={styles.input}
    placeholder="Your Venue Name"
    placeholderTextColor={COLORS.textSecondary}
    value={formData.venueName}
    onChangeText={(text) => {
      setFormData({ ...formData, venueName: text });
      setTouched({ ...touched, venueName: true });
      if (text.length >= 2) {
        validateField('venueName', text);
      } else {
        setFieldStatus(prev => ({ ...prev, venueName: 'neutral' }));
        setErrors(prev => ({ ...prev, venueName: '' }));
      }
    }}
    onBlur={() => {
      setTouched({ ...touched, venueName: true });
      if (formData.venueName) {
        validateField('venueName', formData.venueName);
      }
    }}
    autoCapitalize="words"
  />
  {touched.venueName && fieldStatus.venueName === 'valid' && (
    <Check size={20} color={COLORS.success} />
  )}
  {touched.venueName && fieldStatus.venueName === 'invalid' && (
    <X size={20} color={COLORS.error} />
  )}
</View>

{/* Character counter */}
{touched.venueName && formData.venueName.length > 80 && (
  <Text style={styles.characterCount}>
    {100 - formData.venueName.length} characters remaining
  </Text>
)}
```

### Step 7: Add Styles for Valid/Invalid States

Add to the StyleSheet at the bottom:
```typescript
inputValid: {
  borderColor: COLORS.success,
  borderWidth: 1,
},
characterCount: {
  fontSize: 12,
  color: COLORS.textSecondary,
  marginTop: 4,
  textAlign: 'right',
},
```

---

## Quick Implementation

Due to the file size (706 lines), I recommend implementing in phases:

### Phase 1 (Highest Priority - 30 min):
1. ✅ Add Zod schemas to validation.ts (DONE)
2. Update `validateStep1` and `validateStep2` to use Zod
3. Add real-time validation to email field (most critical)

### Phase 2 (High Priority - 1 hour):
4. Add real-time validation to venue name
5. Add visual feedback icons (checkmarks/X)
6. Add character counter for venue name

### Phase 3 (Medium Priority - 30 min):
7. Add real-time validation to all Step 2 fields
8. Add formatting helpers (phone, ZIP)
9. Disable submit until all valid

---

## Testing Checklist

After implementation, test:
- [ ] Empty fields show error on blur
- [ ] Valid email shows green checkmark
- [ ] Invalid email shows red X and error message
- [ ] Email typo detection works (gmial.com → gmail.com)
- [ ] Venue name under 2 chars shows error
- [ ] Venue name over 100 chars shows error
- [ ] Character counter appears at 80+ characters
- [ ] Phone number formats correctly
- [ ] ZIP code validates 5 and 9 digit formats
- [ ] Website requires http:// or https://
- [ ] Submit button disabled until form valid
- [ ] Step 1 → Step 2 validates before proceeding
- [ ] Step 2 submit validates all fields

---

## Benefits

✅ **Security**: Matches backend validation exactly
✅ **UX**: Immediate feedback as user types
✅ **Prevention**: Catches errors before API call
✅ **Guidance**: Helpful error messages
✅ **Performance**: Reduced unnecessary API calls

---

## Next Steps

1. Implement Phase 1 changes (highest priority)
2. Test thoroughly
3. Commit and deploy
4. Move to Item #4 (Sentry error monitoring)

---

Generated: January 28, 2026
