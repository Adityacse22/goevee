import { Router } from 'express';
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
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stations', stationRoutes);
router.use(chargerRoutes);
router.use('/bookings', bookingRoutes);

export default router;
