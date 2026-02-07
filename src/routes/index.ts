import { Router } from "express";
import * as financeController from "../controllers/finance.controller.js";
import { testConnection } from "../config/supabase.js";
import * as authController from "../controllers/auth.controller.js";
import * as receiptController from "../controllers/receipt.controller.js";
import { authenticate } from "../utils/auth.js";

const router = Router();

// Health check and DB test
router.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// User routes
router.get('/users/:id', authenticate, financeController.getUser);

// Currency routes
router.get('/currencies', authenticate, financeController.getCurrencies);

// Category routes
router.post('/categories', authenticate, financeController.createCategory);
router.get('/users/:userId/categories', authenticate, financeController.getUserCategories);
// Financial Goal routes
router.post('/financial-goals', authenticate, financeController.createFinancialGoal);
router.get('/users/:userId/financial-goals', authenticate, financeController.getUserFinancialGoals);

// Transaction routes
router.post('/transactions', authenticate, financeController.createTransaction);
router.get('/users/:userId/transactions', authenticate, financeController.getUserTransactions);
router.put('/transactions/:id', authenticate, financeController.updateTransaction);
router.delete('/transactions/:id', authenticate, financeController.deleteTransaction);

// Analysis route
router.get('/users/:userId/analysis', authenticate, financeController.getFinancialAnalysis);
// Receipt routes
router.post('/receipts/upload', authenticate, receiptController.uploadReceipt);

router.get('/transactions/:id', authenticate, financeController.getTransactionWithItems);

export default router;