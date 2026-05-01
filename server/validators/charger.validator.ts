import { z } from 'zod';

export const createChargerSchema = z.object({
  body: z.object({
    stationId: z.string(),
    chargerCode: z.string().trim().min(1),
    connectorType: z.string().trim().min(1),
    powerOutputKw: z.coerce.number().positive(),
    currentType: z.string().trim().optional(),
    status: z.enum([
      'AVAILABLE',
      'OCCUPIED',
      'RESERVED',
      'OUT_OF_SERVICE',
      'MAINTENANCE',
    ]).optional(),
  }),
});

export const chargerIdParamSchema = z.object({
  params: z.object({
    chargerId: z.string(),
  }),
});

export const updateChargerStatusSchema = z.object({
  params: z.object({
    chargerId: z.string(),
  }),
  body: z.object({
    status: z.enum([
      'AVAILABLE',
      'OCCUPIED',
      'RESERVED',
      'OUT_OF_SERVICE',
      'MAINTENANCE',
    ]),
    estimatedAvailableAt: z.string().datetime({ offset: true }).optional(),
  }),
});

export type CreateChargerInput = z.infer<typeof createChargerSchema>['body'];
export type UpdateChargerStatusInput = z.infer<typeof updateChargerStatusSchema>['body'];
