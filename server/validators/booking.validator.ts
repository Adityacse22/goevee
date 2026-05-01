import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    chargerId: z.string(),
    vehicleId: z.string().optional(),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    totalPrice: z.coerce.number().nonnegative().optional(),
  }),
});

export const bookingIdParamSchema = z.object({
  params: z.object({
    bookingId: z.string(),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
