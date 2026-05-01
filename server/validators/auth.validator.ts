import { z } from 'zod';

const authRoleSchema = z.enum(['USER', 'OPERATOR']);

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1, 'fullName is required'),
    email: z.string().trim().email(),
    password: z.string().min(6, 'password must be at least 6 characters'),
    phone: z.string().trim().optional(),
    role: authRoleSchema.optional().default('USER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1, 'password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
