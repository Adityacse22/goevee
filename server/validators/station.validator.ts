import { z } from 'zod';

export const createStationSchema = z.object({
  body: z.object({
    operatorId: z.string().optional(),
    name: z.string().trim().min(1),
    address: z.string().trim().min(1),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    pincode: z.string().trim().optional(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'SUSPENDED']).optional(),
    openingTime: z.string().trim().optional(),
    closingTime: z.string().trim().optional(),
    pricingDetails: z.unknown().optional(),
    amenities: z.unknown().optional(),
  }),
});

export const updateStationSchema = z.object({
  params: z.object({
    stationId: z.string(),
  }),
  body: createStationSchema.shape.body.partial(),
});

export const nearbyStationsSchema = z.object({
  query: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    radiusKm: z.coerce.number().positive().optional().default(10),
  }),
});

export const stationIdParamSchema = z.object({
  params: z.object({
    stationId: z.string(),
  }),
});

export type CreateStationInput = z.infer<typeof createStationSchema>['body'];
export type UpdateStationInput = z.infer<typeof updateStationSchema>['body'];
