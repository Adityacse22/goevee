import { Router } from 'express';
import {
  loginController,
  meController,
  registerController,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

import { NODE_ENV, TURNSTILE_SECRET_KEY, TURNSTILE_HOSTNAMES } from '../config/index.js';
import { rateLimit } from '../middlewares/security.js';
import { botProtection } from '../middlewares/botProtection.js';

const router = Router();
const authLimit = rateLimit({ limit: 10, windowMs: 15 * 60 * 1000 });
const protect = (action: string) => botProtection({ secret: TURNSTILE_SECRET_KEY, required: NODE_ENV === 'production', hostnames: TURNSTILE_HOSTNAMES, action });

router.post('/register', authLimit, validate(registerSchema), protect('register'), asyncHandler(registerController));
router.post('/login', authLimit, validate(loginSchema), protect('login'), asyncHandler(loginController));
router.get('/me', authenticate, asyncHandler(meController));

export default router;
