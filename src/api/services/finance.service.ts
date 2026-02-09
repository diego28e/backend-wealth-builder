import { supabase } from '../../config/supabase.js';
import { TransactionSchema, CategorySchema, FinancialGoalSchema } from '../models/finance.model.js';
import type { Transaction, User, Category, FinancialGoal, Currency } from '../models/finance.model.js';

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, profile, default_currency_code, starting_balance, starting_balance_currency_code, starting_balance_date, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
};

export const createCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
  const validatedData = CategorySchema.omit({ id: true }).parse(categoryData);

  const { data, error } = await supabase
    .from('categories')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return data;
};

export const getUserCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('name');

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data || [];
};

export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> => {
  const validatedData = TransactionSchema.omit({ id: true, created_at: true, updated_at: true }).parse(transactionData);

  const { data, error } = await supabase
    .from('transactions')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create transaction: ${error.message}`);
  return data;
};

export const getUserTransactions = async (userId: string, start_date?: string, end_date?: string): Promise<Transaction[]> => {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (start_date) {
    query = query.gte('date', start_date);
  }

  if (end_date) {
    query = query.lte('date', end_date);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
  return data || [];
};

export const getUserTransactionsEnriched = async (userId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (
        name,
        category_groups (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to fetch enriched transactions: ${error.message}`);
  return data || [];
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update transaction: ${error.message}`);
  return data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete transaction: ${error.message}`);
};

export const getCurrencies = async (): Promise<Currency[]> => {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .order('code');

  if (error) throw new Error(`Failed to fetch currencies: ${error.message}`);
  return data || [];
};

export const createFinancialGoal = async (goalData: Omit<FinancialGoal, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialGoal> => {
  const validatedData = FinancialGoalSchema.omit({ id: true, created_at: true, updated_at: true }).parse(goalData);

  const { data, error } = await supabase
    .from('financial_goals')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create financial goal: ${error.message}`);
  return data;
};

export const getUserFinancialGoals = async (userId: string): Promise<FinancialGoal[]> => {
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch financial goals: ${error.message}`);
  return data || [];
};

export const getTransactionWithItems = async (transactionId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_items (
        id,
        item_name,
        quantity,
        unit_price,
        total_amount,
        category_id,
        sort_order,
        created_at
      )
    `)
    .eq('id', transactionId)
    .single();

  if (error) throw new Error(`Failed to fetch transaction with items: ${error.message}`);
  return data;
};

export const updateUserStartingBalance = async (
  userId: string, 
  startingBalance: number, 
  currencyCode: string,
  balanceDate?: string
): Promise<User> => {
  const updateData: any = {
    starting_balance: startingBalance,
    starting_balance_currency_code: currencyCode,
    updated_at: new Date().toISOString()
  };

  if (balanceDate) {
    updateData.starting_balance_date = balanceDate;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, first_name, last_name, profile, default_currency_code, starting_balance, starting_balance_date, starting_balance_currency_code, created_at, updated_at')
    .single();

  if (error) throw new Error(`Failed to update starting balance: ${error.message}`);
  return data;
};

export const getUserBalance = async (userId: string): Promise<{
  starting_balance: number;
  starting_balance_date: string;
  starting_balance_currency_code: string;
  current_calculated_balance: number;
}> => {
  // Get user's starting balance
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('starting_balance, starting_balance_date, starting_balance_currency_code')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(`Failed to fetch user balance: ${userError.message}`);

  // Calculate current balance from transactions
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', user.starting_balance_date);

  if (transError) throw new Error(`Failed to fetch transactions for balance: ${transError.message}`);

  const transactionTotal = transactions?.reduce((total, transaction) => {
    return total + (transaction.type === 'Income' ? transaction.amount : -transaction.amount);
  }, 0) || 0;

  return {
    starting_balance: user.starting_balance,
    starting_balance_date: user.starting_balance_date,
    starting_balance_currency_code: user.starting_balance_currency_code,
    current_calculated_balance: user.starting_balance + transactionTotal
  };
};
