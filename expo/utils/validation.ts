/**
 * Validation schemas using Zod
 * Install: bun add zod
 *
 * These schemas provide runtime type checking and validation for user inputs
 * to prevent security vulnerabilities like XSS, injection attacks, and data corruption
 */

import { z } from 'zod';
import { VALIDATION } from '@/constants/app';

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const usernameSchema = z
  .string()
  .min(VALIDATION.MIN_USERNAME_LENGTH, `Username must be at least ${VALIDATION.MIN_USERNAME_LENGTH} characters`)
  .max(VALIDATION.MAX_USERNAME_LENGTH, `Username must be at most ${VALIDATION.MAX_USERNAME_LENGTH} characters`)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .refine((val) => !val.startsWith('_') && !val.endsWith('_'), {
    message: 'Username cannot start or end with underscore',
  });

export const passwordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`)
  .max(VALIDATION.MAX_PASSWORD_LENGTH, `Password must be at most ${VALIDATION.MAX_PASSWORD_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const createAccountSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(VALIDATION.MAX_DISPLAY_NAME_LENGTH, `Display name must be at most ${VALIDATION.MAX_DISPLAY_NAME_LENGTH} characters`)
  .regex(/^[a-zA-Z0-9\s\-']+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes')
  .refine((val) => val.trim().length > 0, {
    message: 'Display name cannot be only whitespace',
  });

export const bioSchema = z
  .string()
  .max(VALIDATION.MAX_BIO_LENGTH, `Bio must be at most ${VALIDATION.MAX_BIO_LENGTH} characters`)
  .optional()
  .transform((val) => val?.trim());

export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema,
});

// ============================================================================
// VIBE CHECK SCHEMAS
// ============================================================================

export const vibeCheckSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  music: z.number().int().min(0).max(10, 'Music score must be between 0 and 10'),
  density: z.number().int().min(0).max(10, 'Density score must be between 0 and 10'),
  energy: z.enum(['CHILL', 'MODERATE', 'HIGH', 'PEAK'], {
    errorMap: () => ({ message: 'Invalid energy level' }),
  }),
  waitTime: z.enum(['NONE', 'SHORT', 'MEDIUM', 'LONG'], {
    errorMap: () => ({ message: 'Invalid wait time' }),
  }),
});

// ============================================================================
// TOAST POS SCHEMAS
// ============================================================================

export const spendRuleSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  threshold: z.number().int().positive('Threshold must be a positive number'),
  tierUnlocked: z.enum(['REGULAR', 'PLATINUM', 'WHALE'], {
    errorMap: () => ({ message: 'Invalid tier' }),
  }),
  serverAccessLevel: z.enum(['PUBLIC', 'INNER_CIRCLE'], {
    errorMap: () => ({ message: 'Invalid access level' }),
  }),
  isActive: z.boolean(),
  windowHours: z.number().int().positive().optional(),
  performerId: z.string().uuid().optional(),
});

export const transactionSchema = z.object({
  id: z.string(),
  venueId: z.string().uuid('Invalid venue ID'),
  amount: z.number().int().nonnegative('Amount must be non-negative'),
  cardToken: z.string().min(1, 'Card token is required'),
  timestamp: z.string().datetime('Invalid timestamp format'),
  locationId: z.string().optional(),
});

// ============================================================================
// SOCIAL SCHEMAS
// ============================================================================

export const friendLocationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  precision: z.enum(['OFF', 'APPROXIMATE', 'PRECISE'], {
    errorMap: () => ({ message: 'Invalid precision level' }),
  }),
  timestamp: z.string().datetime('Invalid timestamp format'),
});

// ============================================================================
// PERFORMER/TALENT SCHEMAS
// ============================================================================

export const promoVideoSchema = z.object({
  gigId: z.string().uuid('Invalid gig ID'),
  videoUri: z.string().url('Invalid video URI'),
  duration: z.number().int().min(10).max(15, 'Video must be between 10-15 seconds'),
  filterApplied: z.string().optional(),
  hasAudio: z.boolean(),
});

export const gigSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  performerId: z.string().uuid('Invalid performer ID'),
  date: z.string().datetime('Invalid date format'),
  fee: z.number().int().nonnegative('Fee must be non-negative'),
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed and validated data or throws ZodError
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validates data and returns success/error result without throwing
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and data or errors
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Formats Zod errors into user-friendly messages
 * @param error - ZodError object
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

// ============================================================================
// BUSINESS REGISTRATION SCHEMAS
// ============================================================================

export const venueNameSchema = z
  .string()
  .min(2, 'Venue name must be at least 2 characters')
  .max(100, 'Venue name must be 100 characters or less')
  .trim();

export const businessEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .toLowerCase()
  .refine((email) => {
    // Check for common typos
    const domain = email.split('@')[1];
    const typos: Record<string, boolean> = {
      'gmial.com': true,
      'gmai.com': true,
      'yahooo.com': true,
      'hotmial.com': true,
    };
    return !typos[domain];
  }, 'Please check your email domain for typos');

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number')
  .refine((phone) => {
    const digitCount = phone.replace(/\D/g, '').length;
    return digitCount >= 10 && digitCount <= 15;
  }, 'Phone number must be between 10 and 15 digits')
  .optional()
  .or(z.literal(''));

export const websiteSchema = z
  .string()
  .url('Website must be a valid URL')
  .regex(/^https?:\/\//, 'Website must include http:// or https://')
  .optional()
  .or(z.literal(''));

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code (e.g., 12345 or 12345-6789)');

export const businessRegistrationStep1Schema = z.object({
  venueName: venueNameSchema,
  businessEmail: businessEmailSchema,
  businessType: z.enum(['BAR', 'CLUB', 'LOUNGE', 'RESTAURANT', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a business type' }),
  }),
});

export const businessRegistrationStep2Schema = z.object({
  location: z.object({
    address: z.string().min(1, 'Address is required').trim(),
    city: z.string().min(1, 'City is required').trim(),
    state: z.string().min(2, 'State is required').max(2, 'Use 2-letter state code').toUpperCase(),
    zipCode: zipCodeSchema,
    country: z.string().default('USA'),
  }),
  phone: phoneSchema,
  website: websiteSchema,
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

export const businessRegistrationFullSchema = businessRegistrationStep1Schema.merge(
  businessRegistrationStep2Schema
);

// Type exports for TypeScript
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VibeCheckInput = z.infer<typeof vibeCheckSchema>;
export type SpendRuleInput = z.infer<typeof spendRuleSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type FriendLocationInput = z.infer<typeof friendLocationSchema>;
export type PromoVideoInput = z.infer<typeof promoVideoSchema>;
export type GigInput = z.infer<typeof gigSchema>;
export type BusinessRegistrationStep1Input = z.infer<typeof businessRegistrationStep1Schema>;
export type BusinessRegistrationStep2Input = z.infer<typeof businessRegistrationStep2Schema>;
export type BusinessRegistrationFullInput = z.infer<typeof businessRegistrationFullSchema>;
