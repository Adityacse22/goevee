import { Router } from 'express';
import {
  createStationController,
  getStationController,
  listStationsController,
  nearbyStationsController,
  updateStationController,
} from '../controllers/station.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createStationSchema,
  nearbyStationsSchema,
  stationIdParamSchema,
  updateStationSchema,
} from '../validators/station.validator.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('OPERATOR', 'ADMIN'),
  validate(createStationSchema),
  asyncHandler(createStationController),
);
router.get('/', asyncHandler(listStationsController));
router.get('/nearby', validate(nearbyStationsSchema), asyncHandler(nearbyStationsController));
router.get('/:stationId', validate(stationIdParamSchema), asyncHandler(getStationController));
router.patch(
  '/:stationId',
  authenticate,
  requireRole('OPERATOR', 'ADMIN'),
  validate(updateStationSchema),
  asyncHandler(updateStationController),
);

export default router;
