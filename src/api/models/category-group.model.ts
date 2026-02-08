import { z } from 'zod';

export const CategoryGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  sort_order: z.number().int().positive()
});

export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;