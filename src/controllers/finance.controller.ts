import type { Request, Response } from 'express';
import * as financeService from '../api/services/finance.service.js';
import { analyzeFinancials } from '../api/services/llm.service.js';
import { TransactionSchema, CategorySchema, FinancialGoalSchema } from '../api/models/finance.model.js';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const user = await financeService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactionData = TransactionSchema.omit({ id: true, created_at: true, updated_at: true }).parse(req.body);
    const transaction = await financeService.createTransaction(transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
  }
};

export const getUserTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const transactions = await financeService.getUserTransactions(userId);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Transaction ID is required' });
      return;
    }
    const updates = req.body;
    const transaction = await financeService.updateTransaction(id, updates);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
};

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Transaction ID is required' });
      return;
    }
    await financeService.deleteTransaction(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Delete failed' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryData = CategorySchema.omit({ id: true }).parse(req.body);
    const category = await financeService.createCategory(categoryData);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
  }
};

export const getUserCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const categories = await financeService.getUserCategories(userId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const getCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const currencies = await financeService.getCurrencies();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const createFinancialGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const goalData = FinancialGoalSchema.omit({ id: true, created_at: true, updated_at: true }).parse(req.body);
    const goal = await financeService.createFinancialGoal(goalData);
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
  }
};

export const getUserFinancialGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const goals = await financeService.getUserFinancialGoals(userId);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const getFinancialAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Starting financial analysis request for user:', req.params.userId);
    
    const { userId } = req.params;
    if (!userId) {
      console.error('❌ Missing userId parameter');
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    console.log('🔍 Fetching user data...');
    const user = await financeService.getUserById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    console.log('🔍 Fetching enriched user transactions...');
    const transactions = await financeService.getUserTransactionsEnriched(userId);
    console.log('📈 Found', transactions.length, 'transactions');
    
    console.log('🔍 Fetching user financial goals...');
    const goals = await financeService.getUserFinancialGoals(userId);
    console.log('🎯 Found', goals.length, 'financial goals');
    
    console.log('🤖 Calling AI analysis service...');
    const analysis = await analyzeFinancials({
      profile: user.profile,
      goals: goals.map(g => g.name),
      transactions
    });
    
    console.log('✅ Analysis completed successfully');
    res.json({ analysis });
  } catch (error) {
    console.error('❌ Financial analysis failed:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Analysis failed',
      details: error instanceof Error ? error.stack : undefined
    });
  }
};