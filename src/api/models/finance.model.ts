import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  goal_id: z.string().uuid().optional(),
  date: z.string().datetime(),
  amount: z.number().int(),
  type: z.enum(['Income', 'Expense']),
  description: z.string().min(1),
  notes: z.string().optional(),
  currency_code: z.string().length(3),
  receipt_image_url: z.string().optional(),
  receipt_processed_at: z.string().datetime().optional(),
  merchant_name: z.string().optional(),
  has_line_items: z.boolean().optional(),
  account_id: z.string().uuid(),
  transfer_destination_account_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  profile: z.enum(['Low-Income', 'High-Income/High-Expense', 'Wealth-Builder']),
  default_currency_code: z.string().length(3).default('COP'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const AccountTypeSchema = z.enum(['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment', 'Loan', 'Other']);

export const AccountSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  type: AccountTypeSchema,
  currency_code: z.string().length(3),
  current_balance: z.number().int().default(0),
  is_active: z.boolean().default(true),
  color: z.string().optional(),
  is_tax_exempt: z.boolean().default(false),
  interest_rate: z.number().default(0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const AccountConfigurationSchema = z.object({
  id: z.string().uuid().optional(),
  account_id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number(),
  currency_code: z.string().length(3).optional(),
  frequency: z.enum(['PER_TRANSACTION', 'MONTHLY', 'ANNUAL', 'ONE_TIME']),
  applies_to: z.enum(['ALL', 'INCOME', 'EXPENSE', 'BALANCE']).optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional(),
  category_group_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  is_system: z.boolean().optional(),
  created_at: z.string().datetime().optional()
});

export const CategoryGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.enum(['Income', 'Needs', 'Wants', 'Savings']),
  description: z.string().optional(),
  sort_order: z.number().int().default(0)
});

export const FinancialGoalStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED']);

export const FinancialGoalSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  target_amount: z.number().int().optional(),
  current_amount: z.number().int().default(0),
  target_date: z.string().optional(),
  category_id: z.string().uuid().optional(),
  currency_code: z.string().length(3),
  status: FinancialGoalStatusSchema.default('ACTIVE'),
  is_active: z.boolean().default(true), // Deprecated in favor of status, keeping for backward compatibility
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type FinancialGoalStatus = z.infer<typeof FinancialGoalStatusSchema>;

export const CurrencySchema = z.object({
  code: z.string().length(3),
  name: z.string(),
  symbol: z.string(),
  decimal_digits: z.number().int()
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type User = z.infer<typeof UserSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;
export type FinancialGoal = z.infer<typeof FinancialGoalSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type Account = z.infer<typeof AccountSchema>;
export type AccountConfiguration = z.infer<typeof AccountConfigurationSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type FinancialProfile = User['profile'];

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

export type TransactionItem = z.infer<typeof TransactionItemSchema>;

export interface UserFinancials {
  profile: FinancialProfile;
  goals: string[];
  transactions: Transaction[];
}

export interface TransactionWithItems extends Transaction {
  transacion_items: TransactionItem[];
}