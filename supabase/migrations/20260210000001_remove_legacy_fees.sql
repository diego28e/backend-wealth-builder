-- Remove legacy fee columns from accounts table
-- We now use account_configurations for granular fee management.

ALTER TABLE public.accounts 
DROP COLUMN IF EXISTS transaction_fee,
DROP COLUMN IF EXISTS monthly_fee;
