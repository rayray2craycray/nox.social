/**
 * Auth Validation Schemas
 * Zod schemas for authentication endpoints
 */

const { z } = require('zod');

const signUpSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .max(255, 'Email must be 255 characters or fewer')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
  displayName: z
    .string({ required_error: 'Display name is required' })
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or fewer')
    .trim(),
  phoneNumber: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});

const signInSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
});

const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Token is required' })
    .min(1, 'Token is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
});

const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  profileImageUrl: z.string().url('Invalid URL').optional().nullable(),
});

module.exports = {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
};
