'use strict';

const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(254);

// bcrypt only uses the first 72 bytes, so cap there
const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password is too long (max 72 bytes)');

const name = z.string().trim().max(60).optional().default('');

const schemas = {
  signup: z.object({ name, email, password }).strict(),
  login: z.object({ email, password: z.string().min(1).max(200) }).strict(),
  google: z.object({ credential: z.string().min(20).max(4096) }).strict(),
  changePassword: z
    .object({ currentPassword: z.string().min(1).max(200), newPassword: password })
    .strict(),
};

function badRequest(res, zodError) {
  return res.status(400).json({
    error: 'Invalid input',
    code: 'VALIDATION',
    details: zodError.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
  });
}

module.exports = { schemas, badRequest };
