import { supabase } from '../../config/supabase.js';
import { TransactionSchema, CategorySchema, FinancialGoalSchema, AccountSchema } from '../models/finance.model.js';
import type { Transaction, User, Category, FinancialGoal, Currency, Account } from '../models/finance.model.js';

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, profile, default_currency_code, created_at, updated_at')
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


export const getAccounts = async (userId: string) => {
  const { data, error } = await supabase
    .from('accounts')
    .select(`
      *,
      account_configurations (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at');

  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
  return data || [];
};

export const createAccount = async (accountData: any): Promise<Account> => {
  const { configurations, ...accData } = accountData;
  const validatedData = AccountSchema.omit({ id: true, created_at: true, updated_at: true }).parse(accData);

  const { data: account, error } = await supabase
    .from('accounts')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create account: ${error.message}`);

  if (configurations && Array.isArray(configurations)) {
    const configs = configurations.map((c: any) => ({
      ...c,
      account_id: account.id
    }));

    const { error: configError } = await supabase
      .from('account_configurations')
      .insert(configs);

    if (configError) throw new Error(`Failed to create account configurations: ${configError.message}`);
  }

  return account;
};

export const updateMainAccount = async (
  userId: string,
  startingBalance: number,
  currencyCode: string
) => {
  // Find the first account for the user (assumed to be main)
  const { data: accounts, error: fetchError } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .order('created_at')
    .limit(1);

  if (fetchError) throw new Error(`Failed to fetch account: ${fetchError.message}`);

  if (!accounts || accounts.length === 0) {
    // Create one if doesn't exist (fallback)
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name: 'Main Account',
        type: 'Cash',
        currency_code: currencyCode,
        current_balance: startingBalance
      })
      .select()
      .single();

    if (createError) throw new Error(`Failed to create main account: ${createError.message}`);
    return newAccount;
  }

  const accountId = accounts?.[0]?.id!;

  const { data, error } = await supabase
    .from('accounts')
    .update({
      current_balance: startingBalance,
      currency_code: currencyCode,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update account balance: ${error.message}`);
  return data;
};

export const updateAccount = async (id: string, updates: any): Promise<Account> => {
  const { configurations, ...accountUpdates } = updates;

  // 1. Update Account fields if any
  if (Object.keys(accountUpdates).length > 0) {
    const { error } = await supabase
      .from('accounts')
      .update(accountUpdates)
      .eq('id', id);

    if (error) throw new Error(`Failed to update account: ${error.message}`);
  }

  // 2. Update configurations if provided (Replace strategy)
  if (configurations && Array.isArray(configurations)) {
    // Delete existing
    const { error: deleteError } = await supabase
      .from('account_configurations')
      .delete()
      .eq('account_id', id);

    if (deleteError) throw new Error(`Failed to update configurations (delete old): ${deleteError.message}`);

    // Insert new
    if (configurations.length > 0) {
      const configs = configurations.map((c: any) => ({
        ...c,
        id: undefined, // ensure new IDs or let DB generate
        account_id: id
      }));

      const { error: insertError } = await supabase
        .from('account_configurations')
        .insert(configs);

      if (insertError) throw new Error(`Failed to update configurations (insert new): ${insertError.message}`);
    }
  }

  // Return updated structure
  const { data, error: fetchError } = await supabase
    .from('accounts')
    .select(`
      *,
      account_configurations (*)
    `)
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Failed to fetch updated account: ${fetchError.message}`);
  return data;
};

export const getUserBalance = async (userId: string): Promise<{
  accounts_total_balance: number;
  currency_code: string;
  current_calculated_balance: number;
}> => {
  // Get all active accounts
  const { data: accounts, error: accountError } = await supabase
    .from('accounts')
    .select('current_balance, currency_code')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (accountError) throw new Error(`Failed to fetch user accounts: ${accountError.message}`);

  // Calculate total initial balance from all accounts
  const accountsTotal = (accounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  const currencyCode = accounts?.[0]?.currency_code || 'COP';

  // Get all transactions
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId);

  if (transError) throw new Error(`Failed to fetch transactions for balance: ${transError.message}`);

  const transactionTotal = (transactions || []).reduce((total, transaction) => {
    return total + (transaction.type === 'Income' ? transaction.amount : -transaction.amount);
  }, 0);

  return {
    accounts_total_balance: accountsTotal,
    currency_code: currencyCode,
    current_calculated_balance: accountsTotal + transactionTotal
  };
};

export const getCategoryGroupSummary = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> => {
  let query = supabase
    .from('transactions')
    .select(`
      amount,
      type,
      categories!inner (
        category_group_id,
        category_groups!inner (
          id,
          name
        )
      )
    `)
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch category group summary: ${error.message}`);

  // Group and aggregate by category group
  const summaryMap = new Map<string, {
    category_group_id: string;
    category_group_name: string;
    total_amount: number;
    transaction_count: number;
  }>();

  data?.forEach((transaction: any) => {
    const groupId = transaction.categories.category_groups.id;
    const groupName = transaction.categories.category_groups.name;

    // Calculate net amount (Income is positive, Expense is negative)
    const netAmount = transaction.type === 'Income'
      ? transaction.amount
      : -transaction.amount;

    if (summaryMap.has(groupId)) {
      const existing = summaryMap.get(groupId)!;
      existing.total_amount += netAmount;
      existing.transaction_count += 1;
    } else {
      summaryMap.set(groupId, {
        category_group_id: groupId,
        category_group_name: groupName,
        total_amount: netAmount,
        transaction_count: 1
      });
    }
  });

  return Array.from(summaryMap.values());
};