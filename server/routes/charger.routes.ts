import { Router } from 'express';
import {
  createChargerController,
  getChargerController,
  listStationChargersController,
  updateChargerStatusController,
} from '../controllers/charger.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  chargerIdParamSchema,
  createChargerSchema,
  updateChargerStatusSchema,
} from '../validators/charger.validator.js';
import { stationIdParamSchema } from '../validators/station.validator.js';

const router = Router();

router.post(
  '/chargers',
  authenticate,
  requireRole('OPERATOR', 'ADMIN'),
  validate(createChargerSchema),
  asyncHandler(createChargerController),
);
router.get('/chargers/:chargerId', validate(chargerIdParamSchema), asyncHandler(getChargerController));
router.patch(
  '/chargers/:chargerId/status',
  authenticate,
  requireRole('OPERATOR', 'ADMIN'),
  validate(updateChargerStatusSchema),
  asyncHandler(updateChargerStatusController),
);
router.get(
  '/stations/:stationId/chargers',
  validate(stationIdParamSchema),
  asyncHandler(listStationChargersController),
);

export default router;
