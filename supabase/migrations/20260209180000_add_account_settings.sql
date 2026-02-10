-- Create account_configurations table for flexible fees and settings
CREATE TABLE public.account_configurations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  account_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
  value numeric NOT NULL, -- Stores percentage (e.g. 0.4 for 0.4%) or fixed amount in cents (e.g. 15000)
  currency_code character(3), -- Optional, required if type is FIXED
  frequency text NOT NULL CHECK (frequency IN ('PER_TRANSACTION', 'MONTHLY', 'ANNUAL', 'ONE_TIME')),
  applies_to text CHECK (applies_to IN ('ALL', 'INCOME', 'EXPENSE', 'BALANCE')), -- meaningful for transaction fees or interest
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT account_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT account_configurations_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
  CONSTRAINT account_configurations_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code)
);

-- Comment on table and columns
COMMENT ON TABLE public.account_configurations IS 'Stores flexible configuration rules for accounts (fees, taxes, interest)';
COMMENT ON COLUMN public.account_configurations.type IS 'PERCENTAGE (e.g. 0.4%) or FIXED (e.g. $15,000)';
COMMENT ON COLUMN public.account_configurations.value IS 'The numeric value. If PERCENTAGE, 0.4 = 0.4%. If FIXED, integer cents.';
COMMENT ON COLUMN public.account_configurations.applies_to IS 'Condition for application: INCOME (deposits), EXPENSE (withdrawals), BALANCE (for interest)';
