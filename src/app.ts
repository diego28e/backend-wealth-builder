import express from "express";
import type { Application, Request, Response } from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from "./routes/index.js";
import { startYieldJob } from "./jobs/yield.job.js";

// Initialize Cron Jobs
startYieldJob();

const app: Application = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://finance.intellectif.com',
    'https://main.d2zauelvzbn0ho.amplifyapp.com'
  ],
  credentials: true
}))
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req: Request, res: Response) => {
  res.status(200).send("Wealth API is running")
})

app.use('/api/v1', router)

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  console.error('Stack:', reason instanceof Error ? reason.stack : 'No stack trace');
  process.exit(1);
});

export default app;