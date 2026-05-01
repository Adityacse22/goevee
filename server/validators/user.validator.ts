import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    vehicleName: z.string().trim().min(1),
    brand: z.string().trim().optional(),
    model: z.string().trim().optional(),
    connectorType: z.string().trim().optional(),
    batteryCapacity: z.coerce.number().positive().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
