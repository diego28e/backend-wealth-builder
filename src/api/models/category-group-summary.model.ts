import { z } from 'zod';

export const CategoryGroupSummarySchema = z.object({
    category_group_id: z.string(),
    categry_group_name: z.string(),
    total_amount: z.number().int(),
    transaction_count: z.number().int()
});

export type CategoryGroupSummary = z.infer<typeof CategoryGroupSummarySchema>;