import { z } from 'zod';
import { isRadiusKm, PLACE_ID_PATTERN, SESSION_TOKEN_PATTERN, type RadiusKm } from '../../shared/discovery.js';

const latitude = z.number().finite().min(-90).max(90);
const longitude = z.number().finite().min(-180).max(180);
const point = z.object({ lat: latitude, lng: longitude }).strict();

export const stationSearchSchema = z.object({
  body: z.object({
    lat: latitude,
    lng: longitude,
    // Only the published options; anything else is rejected, never clamped.
    radiusKm: z.number().refine(isRadiusKm, { message: 'radiusKm must be one of 10, 20, 30, 50, 100' }).transform(value => value as RadiusKm),
  }).strict(),
});

export const stationIdSchema = z.object({
  params: z.object({ stationId: z.string().regex(PLACE_ID_PATTERN) }),
});

export const autocompleteSchema = z.object({
  body: z.object({
    input: z.string().trim().min(1).max(120),
    sessionToken: z.string().regex(SESSION_TOKEN_PATTERN),
    bias: point.nullish(),
    languageCode: z.string().regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/).nullish(),
  }).strict(),
});

export const resolveLocationSchema = z.object({
  params: z.object({ placeId: z.string().regex(PLACE_ID_PATTERN) }),
  query: z.object({ sessionToken: z.string().regex(SESSION_TOKEN_PATTERN).optional() }).passthrough(),
});

export const reverseGeocodeSchema = z.object({ body: point });
