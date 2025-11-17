# Wealth Tracker API

A Node.js/TypeScript backend for tracking finances and providing AI-powered financial recommendations.

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to SQL Editor and run the contents of `supabase-schema.sql`

### 3. Environment Variables
Update `.env` with your Supabase credentials:
```
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application
```bash
pnpm dev
```

## API Endpoints

### Users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user by ID

### Transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/users/:userId/transactions` - Get user transactions
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

### Analysis
- `GET /api/v1/users/:userId/analysis` - Get AI financial analysis

## Example Requests

### Create User
```json
POST /api/v1/users
{
  "email": "user@example.com",
  "profile": "Low-Income",
  "goals": ["Save for emergency fund", "Reduce expenses"]
}
```

### Create Transaction
```json
POST /api/v1/transactions
{
  "user_id": "user-uuid-here",
  "date": "2024-01-15T10:00:00Z",
  "amount": -50.00,
  "type": "Expense",
  "category": "Food",
  "description": "Grocery shopping"
}
```