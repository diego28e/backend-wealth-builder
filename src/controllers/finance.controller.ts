import type { Request, Response } from 'express';
import * as financeService from '../api/services/finance.service.js';
import * as goalService from '../api/services/goal.service.js';
import { analyzeFinancials } from '../api/services/llm.service.js';
import { TransactionSchema, CategorySchema, AccountSchema } from '../api/models/finance.model.js';
import type { Account } from '../api/models/finance.model.js';

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
    let { date, currency_code, account_id, user_id, ...rest } = req.body;

    // 1. Normalize Date (Handle YYYY-MM-DD by converting to ISO)
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = new Date(date).toISOString();
    }

    // 2. Resolve Account and Currency
    // Fetch user accounts to validate account_id ownership and get currency
    const accounts = await financeService.getAccounts(user_id);
    let selectedAccount: Account | undefined;

    if (account_id) {
      selectedAccount = accounts.find((a: Account) => a.id === account_id);
      if (!selectedAccount) {
        res.status(400).json({ error: 'Invalid account_id or account not found for user' });
        return;
      }
    } else {
      // Default to first account if not specified
      if (accounts.length > 0) {
        selectedAccount = accounts[0];
        account_id = selectedAccount!.id;
      } else {
        res.status(400).json({ error: 'User has no accounts. Please create an account.' });
        return;
      }
    }

    // 3. Infer Currency if missing
    if (!currency_code && selectedAccount) {
      currency_code = (selectedAccount as Account).currency_code;
    }

    // 4. Construct Full Payload
    const fullTransactionData = {
      ...rest,
      user_id,
      account_id,
      date,
      currency_code
    };

    // 5. Validate against Schema
    const validatedData = TransactionSchema.omit({ id: true, created_at: true, updated_at: true }).parse(fullTransactionData);

    // 6. Create Transaction (Service also validates, but we validated to be sure)
    const transaction = await financeService.createTransaction(validatedData as any);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
  }
};

export const getUserTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { start_date, end_date, page = '1', limit = '20' } = req.query;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const { data, total } = await financeService.getUserTransactions(
      userId,
      start_date as string,
      end_date as string,
      pageNum,
      limitNum
    );

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
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
    const goals = await goalService.getGoals(userId);
    console.log('🎯 Found', goals.length, 'financial goals');

    console.log('🤖 Calling AI analysis service...');
    const analysis = await analyzeFinancials({
      profile: user.profile,
      goals: goals.map((g: any) => g.name),
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

export const getTransactionWithItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Transaction ID is required' });
      return;
    }
    const transaction = await financeService.getTransactionWithItems(id);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' })
  }
}

export const updateStartingBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { starting_balance, currency_code } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (starting_balance === undefined || !currency_code) {
      res.status(400).json({ error: 'Starting balance and currency code are required' });
      return;
    }

    const account = await financeService.updateMainAccount(
      userId,
      starting_balance,
      currency_code
    );

    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
};

export const getUserBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const balance = await financeService.getUserBalance(userId);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    const accounts = await financeService.getAccounts(userId);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    // Separate configurations from account data to validate account data specifically
    const { configurations, ...rest } = req.body;
    const accountData = AccountSchema.omit({ id: true, created_at: true, updated_at: true }).parse(rest);

    // Pass everything to service which handles both
    const account = await financeService.createAccount({ ...accountData, configurations });
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' });
  }
};

export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Account ID is required' });
      return;
    }

    // Separate configurations from account data for loose validation (since updates are partial)
    const { configurations, ...rest } = req.body;

    // Validate account fields if present (Partial)
    if (Object.keys(rest).length > 0) {
      AccountSchema.omit({ id: true, created_at: true, updated_at: true }).partial().parse(rest);
    }

    const account = await financeService.updateAccount(id, { ...rest, configurations });
    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
};

export const getCategoryGroupSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { start_date, end_date } = req.query;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const summary = await financeService.getCategoryGroupSummary(
      userId,
      start_date as string,
      end_date as string
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch category group summary'
    });
  }
};