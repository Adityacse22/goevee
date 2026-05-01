import { Router } from 'express';
import {
  cancelBookingController,
  createBookingController,
  getBookingController,
  getMyBookingsController,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { bookingIdParamSchema, createBookingSchema } from '../validators/booking.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), asyncHandler(createBookingController));
router.get('/me', asyncHandler(getMyBookingsController));
router.get('/:bookingId', validate(bookingIdParamSchema), asyncHandler(getBookingController));
router.patch(
  '/:bookingId/cancel',
  validate(bookingIdParamSchema),
  asyncHandler(cancelBookingController),
);

export default router;
