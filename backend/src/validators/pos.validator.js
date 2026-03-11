/**
 * POS Validation Schemas
 * Zod schemas for POS integration and spend rule endpoints
 */

const { z } = require('zod');

const connectPOSSchema = z.object({
  venueId: z
    .string({ required_error: 'Venue ID is required' })
    .min(1, 'Venue ID is required'),
  provider: z.enum(['TOAST', 'SQUARE'], {
    required_error: 'Provider is required',
    invalid_type_error: 'Provider must be TOAST or SQUARE',
  }),
  credentials: z.object(
    {
      apiKey: z
        .string({ required_error: 'API key is required' })
        .min(1, 'API key is required'),
      locationId: z
        .string({ required_error: 'Location ID is required' })
        .min(1, 'Location ID is required'),
      environment: z.enum(['PRODUCTION', 'SANDBOX']).optional().default('PRODUCTION'),
    },
    { required_error: 'Credentials are required' }
  ),
});

const validateCredentialsSchema = z.object({
  provider: z.enum(['TOAST', 'SQUARE'], {
    required_error: 'Provider is required',
    invalid_type_error: 'Provider must be TOAST or SQUARE',
  }),
  credentials: z.object(
    {
      apiKey: z.string().min(1, 'API key is required'),
      locationId: z.string().min(1, 'Location ID is required'),
      environment: z.enum(['PRODUCTION', 'SANDBOX']).optional().default('PRODUCTION'),
    },
    { required_error: 'Credentials are required' }
  ),
});

const createSpendRuleSchema = z.object({
  threshold: z
    .number({ required_error: 'Threshold is required' })
    .positive('Threshold must be greater than 0'),
  tierUnlocked: z.enum(['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'], {
    required_error: 'Tier is required',
    invalid_type_error: 'Invalid tier. Must be GUEST, REGULAR, PLATINUM, or WHALE',
  }),
  serverAccessLevel: z.enum(['PUBLIC_LOBBY', 'INNER_CIRCLE'], {
    required_error: 'Server access level is required',
    invalid_type_error: 'Invalid access level. Must be PUBLIC_LOBBY or INNER_CIRCLE',
  }),
  isLiveOnly: z.boolean().optional().default(false),
  liveTimeWindow: z
    .object({
      startTime: z.string().min(1),
      endTime: z.string().min(1),
    })
    .optional(),
  performerId: z.string().optional(),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(0).optional().default(0),
}).refine(
  (data) => {
    if (data.isLiveOnly) {
      return data.liveTimeWindow && data.liveTimeWindow.startTime && data.liveTimeWindow.endTime;
    }
    return true;
  },
  {
    message: 'Live-only rules require liveTimeWindow with startTime and endTime',
    path: ['liveTimeWindow'],
  }
);

const updateSpendRuleSchema = z.object({
  threshold: z.number().positive('Threshold must be greater than 0').optional(),
  tierUnlocked: z
    .enum(['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'])
    .optional(),
  serverAccessLevel: z
    .enum(['PUBLIC_LOBBY', 'INNER_CIRCLE'])
    .optional(),
  isLiveOnly: z.boolean().optional(),
  liveTimeWindow: z
    .object({
      startTime: z.string().min(1),
      endTime: z.string().min(1),
    })
    .optional(),
  performerId: z.string().optional(),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(0).optional(),
});

module.exports = {
  connectPOSSchema,
  validateCredentialsSchema,
  createSpendRuleSchema,
  updateSpendRuleSchema,
};
