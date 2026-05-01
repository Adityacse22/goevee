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

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(registerController));
router.post('/login', validate(loginSchema), asyncHandler(loginController));
router.get('/me', authenticate, asyncHandler(meController));

export default router;
