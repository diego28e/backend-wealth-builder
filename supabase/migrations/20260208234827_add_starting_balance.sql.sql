-- Add starting_balance and starting_balance_date columns to users table
ALTER TABLE public.users 
ADD COLUMN starting_balance bigint DEFAULT 0,
ADD COLUMN starting_balance_date timestamp with time zone DEFAULT now(),
ADD COLUMN starting_balance_currency_code character(3) DEFAULT 'COP',
ADD CONSTRAINT users_starting_balance_currency_fkey 
  FOREIGN KEY (starting_balance_currency_code) 
  REFERENCES public.currencies(code);

-- Add comment for documentation
COMMENT ON COLUMN public.users.starting_balance IS 'Starting balance for reconciliation purposes (in cents)';
COMMENT ON COLUMN public.users.starting_balance_date IS 'Date when the starting balance was set';
COMMENT ON COLUMN public.users.starting_balance_currency_code IS 'Currency code for the starting balance';
