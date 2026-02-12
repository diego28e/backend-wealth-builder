# Smart Finance System Design & Architecture

## 1. Financial Model "As Built"

### 1.1 Accounts & Liquidity
*   **Structure**: Accounts can be of types `Checking`, `Savings`, `Investment`, `Cash`, `Credit Card`, `Loan`, `Other`.
*   **Liquidity (New)**: Accounts have an `is_liquid` boolean flag.
    *   `true` (Default): Funds are spendable (e.g., Checking, Cash).
    *   `false`: Funds are locked/invested (e.g., CD, Investments).
    *   **Balance Calculation**: Dashboard can filter `Sum(current_balance) WHERE is_liquid = true` for "Spendable Balance" vs "Net Worth".
*   **Pockets ("Cajitas")**: Implemented as separate `Savings` accounts.
    *   Example: "Nu Bank" (Checking) vs "Nu Bank Cajita" (Savings, 7.5% Yield).
    *   Transfers between them track movement without affecting Net Worth.

### 1.2 Transactions & Transfers
*   **Types**: `Income`, `Expense`, `Transfer` (New).
*   **Transfer Logic**:
    *   A Transfer consists of TWO operations:
        1.  **Debit Source**: A transaction (Type: `Transfer`, Amount: -X) on Account A.
        2.  **Credit Destination**: A transaction (Type: `Transfer`, Amount: +X) on Account B.
    *   The `transactions` table has `transfer_destination_account_id` to link the source to the destination.
    *   **Fees**: Fees (e.g., 4x1000) are applied to the *Source* transaction as a separate `Expense` transaction.

### 1.3 Categories (Expanded)
*   **Groups**: Income, Needs (50%), Wants (30%), Savings (20%).
*   **New Categories**:
    *   `Vehicle Maintenance`, `Home Maintenance`, `Education` (Needs).
    *   `Electronics`, `Services` (Wants).
    *   **Removed**: 'Savings Goals' (Ambiguous).

## 2. Receipt Processing (AI)
*   **Engine**: Gemini 2.0 Flash (`gemini-2.0-flash`).
*   **Storage**: Supabase Storage (`receipts` bucket).
*   **Logic**:
    1.  User uploads image.
    2.  Backend parses amount, date, merchant, and **Line Items**.
    3.  **Sanitization**: All amounts forced to **CENTS** (Integers).
    4.  **Transaction**: Created with `has_line_items = true`.
    5.  **Items**: Inserted into `transaction_items` table.

## 3. Financial Goals
*   **Logic**: Goals are targets. Transactions (specifically transfers to savings) can be manually linked to a Goal via `goal_id`.
*   **Status**: `ACTIVE`, `COMPLETED`, `ARCHIVED`, `CANCELLED`.

## 4. Database Schema Key Additions
*   `transaction_items`: Stores receipt line items.
*   `financial_insights`: Stores monthly AI analysis snapshots.
*   `account_configurations`: Stores fee/interest rules.
