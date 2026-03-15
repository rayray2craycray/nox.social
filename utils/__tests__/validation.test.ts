import { z } from 'zod';
import {
  usernameSchema,
  passwordSchema,
  createAccountSchema,
  loginSchema,
  displayNameSchema,
  bioSchema,
  updateProfileSchema,
  vibeCheckSchema,
  spendRuleSchema,
  transactionSchema,
  friendLocationSchema,
  promoVideoSchema,
  gigSchema,
  venueNameSchema,
  businessEmailSchema,
  phoneSchema,
  websiteSchema,
  zipCodeSchema,
  businessRegistrationStep1Schema,
  businessRegistrationStep2Schema,
  businessRegistrationFullSchema,
  validateData,
  safeValidateData,
  formatValidationErrors,
} from '../validation';

// ============================================================================
// USERNAME SCHEMA
// ============================================================================

describe('usernameSchema', () => {
  it('should accept a valid username', () => {
    expect(usernameSchema.parse('validUser123')).toBe('validUser123');
  });

  it('should accept underscores in the middle', () => {
    expect(usernameSchema.parse('valid_user')).toBe('valid_user');
  });

  it('should reject usernames shorter than 3 characters', () => {
    expect(() => usernameSchema.parse('ab')).toThrow();
  });

  it('should reject usernames longer than 30 characters', () => {
    expect(() => usernameSchema.parse('a'.repeat(31))).toThrow();
  });

  it('should reject special characters', () => {
    expect(() => usernameSchema.parse('user@name')).toThrow();
  });

  it('should reject username starting with underscore', () => {
    expect(() => usernameSchema.parse('_username')).toThrow();
  });

  it('should reject username ending with underscore', () => {
    expect(() => usernameSchema.parse('username_')).toThrow();
  });

  it('should reject spaces', () => {
    expect(() => usernameSchema.parse('user name')).toThrow();
  });
});

// ============================================================================
// PASSWORD SCHEMA
// ============================================================================

describe('passwordSchema', () => {
  it('should accept a valid password', () => {
    expect(passwordSchema.parse('SecureP@ss1')).toBe('SecureP@ss1');
  });

  it('should reject passwords shorter than 8 characters', () => {
    expect(() => passwordSchema.parse('Sh0r!')).toThrow();
  });

  it('should reject passwords longer than 128 characters', () => {
    expect(() => passwordSchema.parse('A1!' + 'a'.repeat(126))).toThrow();
  });

  it('should reject passwords without uppercase', () => {
    expect(() => passwordSchema.parse('lowercase1!')).toThrow();
  });

  it('should reject passwords without lowercase', () => {
    expect(() => passwordSchema.parse('UPPERCASE1!')).toThrow();
  });

  it('should reject passwords without numbers', () => {
    expect(() => passwordSchema.parse('NoNumbers!')).toThrow();
  });

  it('should reject passwords without special characters', () => {
    expect(() => passwordSchema.parse('NoSpecial1')).toThrow();
  });
});

// ============================================================================
// CREATE ACCOUNT SCHEMA
// ============================================================================

describe('createAccountSchema', () => {
  it('should accept valid credentials', () => {
    const result = createAccountSchema.parse({
      username: 'testuser',
      password: 'SecureP@ss1',
    });
    expect(result.username).toBe('testuser');
  });

  it('should reject invalid username with valid password', () => {
    expect(() =>
      createAccountSchema.parse({ username: 'ab', password: 'SecureP@ss1' })
    ).toThrow();
  });

  it('should reject valid username with invalid password', () => {
    expect(() =>
      createAccountSchema.parse({ username: 'testuser', password: 'weak' })
    ).toThrow();
  });
});

// ============================================================================
// LOGIN SCHEMA
// ============================================================================

describe('loginSchema', () => {
  it('should accept any non-empty username and password', () => {
    const result = loginSchema.parse({ username: 'a', password: 'b' });
    expect(result).toEqual({ username: 'a', password: 'b' });
  });

  it('should reject empty username', () => {
    expect(() => loginSchema.parse({ username: '', password: 'pass' })).toThrow();
  });

  it('should reject empty password', () => {
    expect(() => loginSchema.parse({ username: 'user', password: '' })).toThrow();
  });
});

// ============================================================================
// DISPLAY NAME SCHEMA
// ============================================================================

describe('displayNameSchema', () => {
  it('should accept a valid display name', () => {
    expect(displayNameSchema.parse("John O'Brien")).toBe("John O'Brien");
  });

  it('should accept hyphens', () => {
    expect(displayNameSchema.parse('Mary-Jane')).toBe('Mary-Jane');
  });

  it('should reject empty string', () => {
    expect(() => displayNameSchema.parse('')).toThrow();
  });

  it('should reject names over 50 characters', () => {
    expect(() => displayNameSchema.parse('A'.repeat(51))).toThrow();
  });

  it('should reject names with special characters', () => {
    expect(() => displayNameSchema.parse('John@Doe')).toThrow();
  });

  it('should reject whitespace-only string', () => {
    expect(() => displayNameSchema.parse('   ')).toThrow();
  });
});

// ============================================================================
// BIO SCHEMA
// ============================================================================

describe('bioSchema', () => {
  it('should accept a valid bio', () => {
    expect(bioSchema.parse('Hello world')).toBe('Hello world');
  });

  it('should accept undefined (optional)', () => {
    expect(bioSchema.parse(undefined)).toBeUndefined();
  });

  it('should trim whitespace', () => {
    expect(bioSchema.parse('  hello  ')).toBe('hello');
  });

  it('should reject bio over 500 characters', () => {
    expect(() => bioSchema.parse('A'.repeat(501))).toThrow();
  });
});

// ============================================================================
// VIBE CHECK SCHEMA
// ============================================================================

describe('vibeCheckSchema', () => {
  const validVibeCheck = {
    venueId: '550e8400-e29b-41d4-a716-446655440000',
    music: 7,
    density: 5,
    energy: 'HIGH' as const,
    waitTime: 'SHORT' as const,
  };

  it('should accept valid vibe check data', () => {
    const result = vibeCheckSchema.parse(validVibeCheck);
    expect(result.venueId).toBe(validVibeCheck.venueId);
  });

  it('should reject invalid UUID for venueId', () => {
    expect(() =>
      vibeCheckSchema.parse({ ...validVibeCheck, venueId: 'not-a-uuid' })
    ).toThrow();
  });

  it('should reject music score over 10', () => {
    expect(() =>
      vibeCheckSchema.parse({ ...validVibeCheck, music: 11 })
    ).toThrow();
  });

  it('should reject negative density', () => {
    expect(() =>
      vibeCheckSchema.parse({ ...validVibeCheck, density: -1 })
    ).toThrow();
  });

  it('should reject invalid energy level', () => {
    expect(() =>
      vibeCheckSchema.parse({ ...validVibeCheck, energy: 'INVALID' })
    ).toThrow();
  });

  it('should reject invalid wait time', () => {
    expect(() =>
      vibeCheckSchema.parse({ ...validVibeCheck, waitTime: 'FOREVER' })
    ).toThrow();
  });
});

// ============================================================================
// SPEND RULE SCHEMA
// ============================================================================

describe('spendRuleSchema', () => {
  const validSpendRule = {
    venueId: '550e8400-e29b-41d4-a716-446655440000',
    threshold: 100,
    tierUnlocked: 'PLATINUM' as const,
    serverAccessLevel: 'PUBLIC' as const,
    isActive: true,
  };

  it('should accept valid spend rule', () => {
    expect(spendRuleSchema.parse(validSpendRule)).toMatchObject(validSpendRule);
  });

  it('should accept optional windowHours', () => {
    const result = spendRuleSchema.parse({ ...validSpendRule, windowHours: 24 });
    expect(result.windowHours).toBe(24);
  });

  it('should reject zero threshold', () => {
    expect(() =>
      spendRuleSchema.parse({ ...validSpendRule, threshold: 0 })
    ).toThrow();
  });

  it('should reject invalid tier', () => {
    expect(() =>
      spendRuleSchema.parse({ ...validSpendRule, tierUnlocked: 'BRONZE' })
    ).toThrow();
  });
});

// ============================================================================
// TRANSACTION SCHEMA
// ============================================================================

describe('transactionSchema', () => {
  const validTransaction = {
    id: 'txn-001',
    venueId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 5000,
    cardToken: 'tok_abc123',
    timestamp: '2025-01-15T20:30:00Z',
  };

  it('should accept valid transaction', () => {
    expect(transactionSchema.parse(validTransaction)).toMatchObject(validTransaction);
  });

  it('should reject negative amount', () => {
    expect(() =>
      transactionSchema.parse({ ...validTransaction, amount: -100 })
    ).toThrow();
  });

  it('should reject empty card token', () => {
    expect(() =>
      transactionSchema.parse({ ...validTransaction, cardToken: '' })
    ).toThrow();
  });

  it('should reject invalid timestamp', () => {
    expect(() =>
      transactionSchema.parse({ ...validTransaction, timestamp: 'not-a-date' })
    ).toThrow();
  });
});

// ============================================================================
// FRIEND LOCATION SCHEMA
// ============================================================================

describe('friendLocationSchema', () => {
  const validLocation = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    latitude: 37.7749,
    longitude: -122.4194,
    precision: 'APPROXIMATE' as const,
    timestamp: '2025-01-15T20:30:00Z',
  };

  it('should accept valid friend location', () => {
    expect(friendLocationSchema.parse(validLocation)).toMatchObject(validLocation);
  });

  it('should reject latitude > 90', () => {
    expect(() =>
      friendLocationSchema.parse({ ...validLocation, latitude: 91 })
    ).toThrow();
  });

  it('should reject longitude < -180', () => {
    expect(() =>
      friendLocationSchema.parse({ ...validLocation, longitude: -181 })
    ).toThrow();
  });

  it('should reject invalid precision', () => {
    expect(() =>
      friendLocationSchema.parse({ ...validLocation, precision: 'EXACT' })
    ).toThrow();
  });
});

// ============================================================================
// PROMO VIDEO SCHEMA
// ============================================================================

describe('promoVideoSchema', () => {
  const validPromo = {
    gigId: '550e8400-e29b-41d4-a716-446655440000',
    videoUri: 'https://example.com/video.mp4',
    duration: 12,
    hasAudio: true,
  };

  it('should accept valid promo video', () => {
    expect(promoVideoSchema.parse(validPromo)).toMatchObject(validPromo);
  });

  it('should reject duration under 10', () => {
    expect(() =>
      promoVideoSchema.parse({ ...validPromo, duration: 9 })
    ).toThrow();
  });

  it('should reject duration over 15', () => {
    expect(() =>
      promoVideoSchema.parse({ ...validPromo, duration: 16 })
    ).toThrow();
  });

  it('should reject invalid video URI', () => {
    expect(() =>
      promoVideoSchema.parse({ ...validPromo, videoUri: 'not-a-url' })
    ).toThrow();
  });
});

// ============================================================================
// GIG SCHEMA
// ============================================================================

describe('gigSchema', () => {
  const validGig = {
    venueId: '550e8400-e29b-41d4-a716-446655440000',
    performerId: '660e8400-e29b-41d4-a716-446655440001',
    date: '2025-06-15T21:00:00Z',
    fee: 500,
    status: 'UPCOMING' as const,
  };

  it('should accept valid gig', () => {
    expect(gigSchema.parse(validGig)).toMatchObject(validGig);
  });

  it('should reject negative fee', () => {
    expect(() => gigSchema.parse({ ...validGig, fee: -100 })).toThrow();
  });

  it('should reject invalid status', () => {
    expect(() => gigSchema.parse({ ...validGig, status: 'PENDING' })).toThrow();
  });
});

// ============================================================================
// BUSINESS REGISTRATION SCHEMAS
// ============================================================================

describe('businessEmailSchema', () => {
  it('should accept a valid email and lowercase it', () => {
    expect(businessEmailSchema.parse('User@Example.com')).toBe('user@example.com');
  });

  it('should reject common typo domains', () => {
    expect(() => businessEmailSchema.parse('user@gmial.com')).toThrow();
  });

  it('should reject invalid email format', () => {
    expect(() => businessEmailSchema.parse('not-an-email')).toThrow();
  });
});

describe('phoneSchema', () => {
  it('should accept a valid phone number', () => {
    expect(phoneSchema.parse('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
  });

  it('should accept empty string', () => {
    expect(phoneSchema.parse('')).toBe('');
  });

  it('should accept undefined (optional)', () => {
    expect(phoneSchema.parse(undefined)).toBeUndefined();
  });

  it('should reject phone with too few digits', () => {
    expect(() => phoneSchema.parse('12345')).toThrow();
  });

  it('should reject phone with letters', () => {
    expect(() => phoneSchema.parse('555-CALL-NOW')).toThrow();
  });
});

describe('zipCodeSchema', () => {
  it('should accept 5-digit zip', () => {
    expect(zipCodeSchema.parse('10001')).toBe('10001');
  });

  it('should accept zip+4 format', () => {
    expect(zipCodeSchema.parse('10001-1234')).toBe('10001-1234');
  });

  it('should reject invalid zip', () => {
    expect(() => zipCodeSchema.parse('1234')).toThrow();
  });

  it('should reject letters in zip', () => {
    expect(() => zipCodeSchema.parse('ABCDE')).toThrow();
  });
});

describe('websiteSchema', () => {
  it('should accept https URL', () => {
    expect(websiteSchema.parse('https://example.com')).toBe('https://example.com');
  });

  it('should accept empty string', () => {
    expect(websiteSchema.parse('')).toBe('');
  });

  it('should reject URL without protocol', () => {
    expect(() => websiteSchema.parse('example.com')).toThrow();
  });
});

describe('venueNameSchema', () => {
  it('should accept valid venue name and trim it', () => {
    expect(venueNameSchema.parse('  Club Echo  ')).toBe('Club Echo');
  });

  it('should reject name shorter than 2 characters', () => {
    expect(() => venueNameSchema.parse('A')).toThrow();
  });

  it('should reject name over 100 characters', () => {
    expect(() => venueNameSchema.parse('X'.repeat(101))).toThrow();
  });
});

describe('businessRegistrationStep1Schema', () => {
  it('should accept valid step 1 data', () => {
    const result = businessRegistrationStep1Schema.parse({
      venueName: 'Club Echo',
      businessEmail: 'info@clubecho.com',
      businessType: 'CLUB',
    });
    expect(result.venueName).toBe('Club Echo');
  });

  it('should reject invalid business type', () => {
    expect(() =>
      businessRegistrationStep1Schema.parse({
        venueName: 'Club Echo',
        businessEmail: 'info@clubecho.com',
        businessType: 'INVALID',
      })
    ).toThrow();
  });
});

describe('businessRegistrationStep2Schema', () => {
  const validStep2 = {
    location: {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
  };

  it('should accept valid step 2 data', () => {
    const result = businessRegistrationStep2Schema.parse(validStep2);
    expect(result.location.city).toBe('New York');
    expect(result.location.state).toBe('NY');
    expect(result.location.country).toBe('USA');
  });

  it('should reject missing address', () => {
    expect(() =>
      businessRegistrationStep2Schema.parse({
        location: { address: '', city: 'NYC', state: 'NY', zipCode: '10001' },
      })
    ).toThrow();
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

describe('validateData', () => {
  it('should return parsed data for valid input', () => {
    const result = validateData(usernameSchema, 'validUser');
    expect(result).toBe('validUser');
  });

  it('should throw ZodError for invalid input', () => {
    expect(() => validateData(usernameSchema, 'ab')).toThrow(z.ZodError);
  });
});

describe('safeValidateData', () => {
  it('should return success true for valid input', () => {
    const result = safeValidateData(usernameSchema, 'validUser');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('validUser');
    }
  });

  it('should return success false for invalid input', () => {
    const result = safeValidateData(usernameSchema, 'ab');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeInstanceOf(z.ZodError);
    }
  });
});

describe('formatValidationErrors', () => {
  it('should format errors with path', () => {
    const result = createAccountSchema.safeParse({ username: 'ab', password: 'weak' });
    if (!result.success) {
      const messages = formatValidationErrors(result.error);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toContain('username');
    }
  });

  it('should format errors without path', () => {
    const result = usernameSchema.safeParse('ab');
    if (!result.success) {
      const messages = formatValidationErrors(result.error);
      expect(messages.length).toBeGreaterThan(0);
      // Top-level errors have empty path, so message should not have a prefix
      expect(messages[0]).not.toContain(':');
    }
  });
});
