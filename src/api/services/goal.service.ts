import { supabase } from '../../config/supabase.js';
import { FinancialGoalSchema } from '../models/finance.model.js';
import type { FinancialGoal } from '../models/finance.model.js';

export const createGoal = async (userId: string, goalData: Partial<FinancialGoal>): Promise<FinancialGoal> => {
    const result = FinancialGoalSchema.omit({
        id: true,
        user_id: true,
        created_at: true,
        updated_at: true
    }).safeParse(goalData);

    if (!result.success) {
        throw new Error(`Invalid goal data: ${result.error.message}`);
    }

    const { data, error } = await supabase
        .from('financial_goals')
        .insert({
            ...result.data,
            user_id: userId,
            status: 'ACTIVE'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const getGoals = async (userId: string): Promise<FinancialGoal[]> => {
    const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'ARCHIVED') // Exclude archived goals by default
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

export const getGoalById = async (goalId: string, userId: string): Promise<FinancialGoal | null> => {
    const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

    if (error) return null;
    return data;
};

export const updateGoal = async (goalId: string, userId: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> => {
    const { data, error } = await supabase
        .from('financial_goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const deleteGoal = async (goalId: string, userId: string): Promise<void> => {
    // Soft delete by setting status to ARCHIVED
    const { error } = await supabase
        .from('financial_goals')
        .update({ status: 'ARCHIVED', is_active: false })
        .eq('id', goalId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
};
