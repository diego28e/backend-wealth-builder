import { Router } from "express";
import * as financeController from "../controllers/finance.controller.js";
import { testConnection } from "../config/supabase.js";
import * as authController from "../controllers/auth.controller.js";

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

// User routes
router.post('/users', financeController.createUser);
router.get('/users/:id', financeController.getUser);

// Category routes
router.post('/categories', financeController.createCategory);
router.get('/users/:userId/categories', financeController.getUserCategories);

// Transaction routes
router.post('/transactions', financeController.createTransaction);
router.get('/users/:userId/transactions', financeController.getUserTransactions);
router.put('/transactions/:id', financeController.updateTransaction);
router.delete('/transactions/:id', financeController.deleteTransaction);

// Analysis route
router.get('/users/:userId/analysis', financeController.getFinancialAnalysis);

export default router;