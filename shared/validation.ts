import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().max(254).email('Enter a valid email address.');
export const nameSchema = z.string().trim().min(2, 'Enter at least 2 characters for your name.').max(100, 'Name must be 100 characters or fewer.');
export const passwordSchema = z.string().min(12, 'Use at least 12 characters for your password.').refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be 72 UTF-8 bytes or fewer.');
export const phoneSchema = z.string().trim().max(20).refine(value => !value || /^\+?[\d ()-]{7,20}$/.test(value), 'Enter a valid phone number.');
export const loginFields = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password.').max(256) });
export const registerFields = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Confirm you are at least 18 and accept the terms.' }) }),
  website: z.string().max(0, 'Unable to submit this form.').optional(),
  turnstileToken: z.string().max(2048).optional(),
});
export type BotProtection = { website?: string; turnstileToken?: string; acceptedTerms?: boolean };
