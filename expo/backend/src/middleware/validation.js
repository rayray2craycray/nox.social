/**
 * Zod Validation Middleware
 * Generic middleware factory that validates req.body against a Zod schema
 */

const { ZodError } = require('zod');

/**
 * Create an Express middleware that validates req.body against the given Zod schema.
 * On validation failure, returns 400 with structured error details.
 * On success, replaces req.body with the parsed (coerced/stripped) data and calls next().
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace body with parsed data (applies defaults, strips unknown keys)
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
