import { supabase } from '../../config/supabase.js';
import { TransactionSchema, CategorySchema } from '../models/finance.model.js';
import type { Transaction, User, Category } from '../models/finance.model.js';

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, profile, created_at, updated_at')
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

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
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