-- Add settings columns to accounts table
ALTER TABLE public.accounts 
ADD COLUMN is_tax_exempt boolean DEFAULT false,
ADD COLUMN interest_rate numeric(5,2) DEFAULT 0,
ADD COLUMN monthly_fee bigint DEFAULT 0,
ADD COLUMN transaction_fee bigint DEFAULT 0;

-- Comment on columns for clarity
COMMENT ON COLUMN public.accounts.is_tax_exempt IS 'Whether the account is exempt from taxes like 4x1000 (GMF)';
COMMENT ON COLUMN public.accounts.interest_rate IS 'Annual interest rate percentage (APY)';
COMMENT ON COLUMN public.accounts.monthly_fee IS 'Fixed monthly maintenance fee in cents';
COMMENT ON COLUMN public.accounts.transaction_fee IS 'Fee per transaction in cents';
