import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  date: z.string().datetime(),
  amount: z.number(),
  type: z.enum(['Income', 'Expense']),
  description: z.string().min(1),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  first_name:z.string(),
  last_name:z.string(),
  profile: z.enum(['Low-Income', 'High-Income/High-Expense', 'Wealth-Builder']),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  name: z.string().min(1)
});

export const GoalSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional()
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type User = z.infer<typeof UserSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type FinancialProfile = User['profile'];

export interface UserFinancials {
  profile: FinancialProfile;
  goals: string[];
  transactions: Transaction[];
}