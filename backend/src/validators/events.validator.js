/**
 * Events Validation Schemas
 * Zod schemas for event endpoints
 */

const { z } = require('zod');

const createEventSchema = z.object({
  venueId: z
    .string({ required_error: 'Venue ID is required' })
    .min(1, 'Venue ID is required'),
  venueName: z
    .string({ required_error: 'Venue name is required' })
    .min(1, 'Venue name is required')
    .max(100),
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer')
    .trim(),
  description: z.string().max(5000).optional(),
  performerIds: z.array(z.string()).optional(),
  performerNames: z.array(z.string().max(100)).optional(),
  date: z
    .string({ required_error: 'Date is required' })
    .min(1, 'Date is required'),
  startTime: z
    .string({ required_error: 'Start time is required' })
    .min(1, 'Start time is required'),
  endTime: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  genres: z.array(z.string().max(50)).optional(),
  ageRestriction: z.number().int().min(0).max(30).optional(),
  capacity: z.number().int().positive().optional(),
  tags: z.array(z.string().max(50)).optional(),
  ticketTiers: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        price: z.number().min(0),
        quantity: z.number().int().positive(),
        tier: z.enum(['GENERAL', 'VIP', 'VVIP', 'TABLE']).optional(),
        salesWindow: z.object({
          start: z.string(),
          end: z.string(),
        }),
        isAppExclusive: z.boolean().optional(),
        benefits: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).optional(),
  performerIds: z.array(z.string()).optional(),
  performerNames: z.array(z.string().max(100)).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  genres: z.array(z.string().max(50)).optional(),
  ageRestriction: z.number().int().min(0).max(30).optional(),
  capacity: z.number().int().positive().optional(),
  tags: z.array(z.string().max(50)).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
};
