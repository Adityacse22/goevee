import { z } from 'zod';

export const uuidParam = (name: string) => z.object({
  params: z.object({
    [name]: z.string(),
  }),
});

export const optionalNumber = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error('Expected a numeric value');
  }
  return parsed;
});
