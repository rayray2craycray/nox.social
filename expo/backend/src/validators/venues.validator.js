/**
 * Venues Validation Schemas
 * Zod schemas for venue management endpoints
 */

const { z } = require('zod');

const updateVenueInfoSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  location: z
    .object({
      address: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(50).optional(),
      zip: z.string().max(20).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
  coverCharge: z.number().min(0).optional().nullable(),
  hours: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string().max(50)).optional(),
  capacity: z.number().int().positive().optional(),
  priceLevel: z.number().int().min(1).max(4).optional(),
});

const updateVenueDisplaySchema = z.object({
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).optional(),
  genres: z.array(z.string().max(50)).optional(),
});

const assignVenueRoleSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .min(1, 'User ID is required'),
  role: z.enum(['HEAD_MODERATOR', 'MODERATOR', 'STAFF', 'VIEWER'], {
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role',
  }),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

module.exports = {
  updateVenueInfoSchema,
  updateVenueDisplaySchema,
  assignVenueRoleSchema,
};
