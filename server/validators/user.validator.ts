import { z } from 'zod';
import { nameSchema, phoneSchema } from '../../shared/validation.js';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: nameSchema.optional(),
    phone: phoneSchema.optional(),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    vehicleName: z.string().trim().min(1).max(100),
    brand: z.string().trim().max(100).optional(),
    model: z.string().trim().max(100).optional(),
    connectorType: z.string().trim().max(100).optional(),
    batteryCapacity: z.coerce.number().positive().max(1000).optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
