import { z } from 'zod';

export const TransactionItemSchema = z.object({
  id: z.string().uuid().optional(),
  transaction_id: z.string().uuid(),
  item_name: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().int(),
  total_amount: z.number().int(),
  category_id: z.string().uuid().optional(),
  sort_order: z.number().int().default(0),
  created_at: z.string().datetime().optional()
});

export const ReceiptDataSchema = z.object({
  merchant_name: z.string(),
  date: z.string().datetime(),
  currency_code: z.string().length(3),
  total_amount: z.number().int(),
  items: z.array(z.object({
    item_name: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().int(),
    total_amount: z.number().int(),
    suggested_category_id: z.string().uuid().optional()
  }))
});

export type TransactionItem = z.infer<typeof TransactionItemSchema>;
export type ReceiptData = z.infer<typeof ReceiptDataSchema>;
