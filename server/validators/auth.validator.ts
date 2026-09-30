import { z } from 'zod';
import { loginFields, registerFields } from '../../shared/validation.js';

// Public registration cannot grant operator/admin privileges.
export const registerSchema = z.object({ body: registerFields.extend({ role: z.literal('USER').default('USER') }) });
export const loginSchema = z.object({ body: loginFields.extend({ website: z.string().max(0).optional(), turnstileToken: z.string().max(2048).optional() }) });
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
