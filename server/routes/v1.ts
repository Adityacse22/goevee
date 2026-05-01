import { Router } from 'express';
import { BOOKING_BUFFER_MINUTES, GOOGLE_MAPS_API_KEY } from '../config/index.js';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import chargerRoutes from './charger.routes.js';
import stationRoutes from './station.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    api: 'v1',
    google_maps_key_set: Boolean(GOOGLE_MAPS_API_KEY.trim()),
    booking_buffer_minutes: BOOKING_BUFFER_MINUTES,
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stations', stationRoutes);
router.use(chargerRoutes);
router.use('/bookings', bookingRoutes);

export default router;
