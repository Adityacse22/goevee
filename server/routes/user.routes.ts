import { Router } from 'express';
import {
  createVehicleController,
  getProfileController,
  getUserBookingsController,
  getUserFavoritesController,
  updateProfileController,
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createVehicleSchema, updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/profile', asyncHandler(getProfileController));
router.patch('/profile', validate(updateProfileSchema), asyncHandler(updateProfileController));
router.post('/vehicles', validate(createVehicleSchema), asyncHandler(createVehicleController));
router.get('/bookings', asyncHandler(getUserBookingsController));
router.get('/favorites', asyncHandler(getUserFavoritesController));

export default router;
