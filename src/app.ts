import express from "express";
import type {Application, Request, Response} from "express";
import router from "./routes/index.js";

const app: Application = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).send("Toon Wealth API is running")
})

// URL-encoded parser
app.use(express.urlencoded({extended: true}))

app.use('/api/v1', router)

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;