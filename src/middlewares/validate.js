import { z } from 'zod';

/**
 * Generic Zod validation middleware factory.
 * Validates req.body by default; pass { params, query } to validate those too.
 *
 * Usage: router.post('/route', validate(MySchema), handler)
 */
export function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      req[target] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Problem Schemas ─────────────────────────────────────────────────────────

export const createProblemSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string().min(1).max(30)).min(1).max(10).default([]),
  timeLimit: z.coerce.number().int().min(100).max(10000).default(2000),
  memoryLimit: z.coerce.number().int().min(16).max(512).default(256),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })
    )
    .default([]),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      })
    )
    .min(1),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateProblemSchema = createProblemSchema.partial().extend({
  status: z.enum(['draft', 'published']).optional(),
});

// ─── Submission Schemas ───────────────────────────────────────────────────────

export const createSubmissionSchema = z.object({
  problemSlug: z.string().min(1),
  language: z.enum(['cpp', 'python', 'javascript']),
  code: z.string().min(1).max(65536),
});
