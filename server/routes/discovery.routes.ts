/**
 * /api/v1/discovery — charger discovery backed by a provider adapter.
 * Coordinates travel in POST bodies (not URLs) so access logs never hold them.
 * Fixed endpoints only: no client-controlled URLs or field masks (no open proxy).
 * Limits are per instance; add an edge/firewall limit before scaling out.
 */
import { Router } from 'express';
import {
  autocompleteController,
  resolveLocationController,
  reverseGeocodeController,
  searchStationsController,
  stationDetailsController,
  validateDiscovery,
} from '../controllers/discovery.controller.js';
import { rateLimit } from '../middlewares/security.js';
import {
  autocompleteSchema,
  resolveLocationSchema,
  reverseGeocodeSchema,
  stationIdSchema,
  stationSearchSchema,
} from '../validators/discovery.validator.js';

const router = Router();

router.post('/stations/search', rateLimit({ limit: 30, windowMs: 60_000 }), validateDiscovery(stationSearchSchema), searchStationsController);
router.get('/stations/:stationId', rateLimit({ limit: 60, windowMs: 60_000 }), validateDiscovery(stationIdSchema), stationDetailsController);
router.post('/autocomplete', rateLimit({ limit: 90, windowMs: 60_000 }), validateDiscovery(autocompleteSchema), autocompleteController);
router.get('/locations/:placeId', rateLimit({ limit: 60, windowMs: 60_000 }), validateDiscovery(resolveLocationSchema), resolveLocationController);
router.post('/reverse-geocode', rateLimit({ limit: 20, windowMs: 60_000 }), validateDiscovery(reverseGeocodeSchema), reverseGeocodeController);

export default router;
