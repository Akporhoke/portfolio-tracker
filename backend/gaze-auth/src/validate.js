'use strict';

const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(254);

// bcrypt only uses the first 72 bytes, so cap there
const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password is too long (max 72 bytes)');

const name = z.string().trim().max(60).optional().default('');

// Letters (any language), numbers, spaces and . ' _ -   (max 30). Empty string = clear it.
const NICK_RX = /^[\p{L}\p{N} .'_-]+$/u;
const nickname = z
  .string()
  .trim()
  .max(30, 'Nickname is too long (max 30 characters)')
  .transform((v) => v.replace(/\s+/g, ' '))
  .refine((v) => v === '' || NICK_RX.test(v), 'Nickname can only use letters, numbers, spaces and . - _');

const schemas = {
  signup: z.object({ name, email, password }).strict(),
  login: z.object({ email, password: z.string().min(1).max(200) }).strict(),
  google: z.object({ credential: z.string().min(20).max(4096) }).strict(),
  profile: z
    .object({ nickname: nickname.optional(), nicknamePrompted: z.literal(true).optional() })
    .strict()
    .refine((o) => o.nickname !== undefined || o.nicknamePrompted === true, { message: 'Nothing to update' }),
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
