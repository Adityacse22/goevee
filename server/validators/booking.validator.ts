import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    chargerId: z.string().trim().min(1).max(128),
    vehicleId: z.string().trim().min(1).max(128).optional(),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    totalPrice: z.coerce.number().finite().nonnegative().max(1000000).optional(),
  }).refine(body => Date.parse(body.startTime) > Date.now(), { message: 'Choose a future start time.', path: ['startTime'] })
    .refine(body => Date.parse(body.endTime) > Date.parse(body.startTime), { message: 'End time must be after start time.', path: ['endTime'] })
    .refine(body => Date.parse(body.endTime) - Date.parse(body.startTime) <= 24 * 60 * 60 * 1000, { message: 'A session cannot exceed 24 hours.', path: ['endTime'] }),
});

export const bookingIdParamSchema = z.object({
  params: z.object({
    bookingId: z.string(),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
