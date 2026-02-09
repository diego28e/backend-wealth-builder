-- Migration: Add multi-account support
-- Date: 2026-02-09

-- 1. Create account_type enum
CREATE TYPE public.account_type AS ENUM ('Checking', 'Savings', 'Credit Card', 'Cash', 'Investment', 'Loan', 'Other');

-- 2. Create accounts table
CREATE TABLE public.accounts (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    type public.account_type NOT NULL,
    currency_code character(3) NOT NULL,
    current_balance bigint NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    color character varying(7),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT accounts_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code)
);

-- Indexes for accounts
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions for accounts table
GRANT DELETE ON TABLE public.accounts TO "anon";
GRANT INSERT ON TABLE public.accounts TO "anon";
GRANT REFERENCES ON TABLE public.accounts TO "anon";
GRANT SELECT ON TABLE public.accounts TO "anon";
GRANT TRIGGER ON TABLE public.accounts TO "anon";
GRANT TRUNCATE ON TABLE public.accounts TO "anon";
GRANT UPDATE ON TABLE public.accounts TO "anon";

GRANT DELETE ON TABLE public.accounts TO "authenticated";
GRANT INSERT ON TABLE public.accounts TO "authenticated";
GRANT REFERENCES ON TABLE public.accounts TO "authenticated";
GRANT SELECT ON TABLE public.accounts TO "authenticated";
GRANT TRIGGER ON TABLE public.accounts TO "authenticated";
GRANT TRUNCATE ON TABLE public.accounts TO "authenticated";
GRANT UPDATE ON TABLE public.accounts TO "authenticated";

GRANT DELETE ON TABLE public.accounts TO "postgres";
GRANT INSERT ON TABLE public.accounts TO "postgres";
GRANT REFERENCES ON TABLE public.accounts TO "postgres";
GRANT SELECT ON TABLE public.accounts TO "postgres";
GRANT TRIGGER ON TABLE public.accounts TO "postgres";
GRANT TRUNCATE ON TABLE public.accounts TO "postgres";
GRANT UPDATE ON TABLE public.accounts TO "postgres";

GRANT DELETE ON TABLE public.accounts TO "service_role";
GRANT INSERT ON TABLE public.accounts TO "service_role";
GRANT REFERENCES ON TABLE public.accounts TO "service_role";
GRANT SELECT ON TABLE public.accounts TO "service_role";
GRANT TRIGGER ON TABLE public.accounts TO "service_role";
GRANT TRUNCATE ON TABLE public.accounts TO "service_role";
GRANT UPDATE ON TABLE public.accounts TO "service_role";


-- 3. Data Migration: Create default accounts for existing users
DO $$
DECLARE
    user_record RECORD;
    new_account_id UUID;
BEGIN
    FOR user_record IN SELECT * FROM public.users LOOP
        -- Insert a new account for each user
        INSERT INTO public.accounts (user_id, name, type, currency_code, current_balance)
        VALUES (
            user_record.id, 
            'Main Account', -- Default name as requested
            'Cash', -- Default type, user can change later
            COALESCE(user_record.starting_balance_currency_code, user_record.default_currency_code, 'COP'),
            COALESCE(user_record.starting_balance, 0)
        )
        RETURNING id INTO new_account_id;

        -- Update existing transactions for this user to point to the new account
        -- Note: This is an initial migration, so we assume all existing transactions belong to this main account
        -- Only update if there are transactions for this user (to avoid constraint violation if transactions table is empty but users exist)
        -- Actually, we plan to add the column first, so let's do that outside the loop first.
    END LOOP;
END $$;

-- WAIT! The loop approach is good but let's do it in steps to be cleaner with schema changes.

-- 3a. Add account_id column to transactions (nullable first)
ALTER TABLE public.transactions 
ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;

-- 3b. Add transfer destination column
ALTER TABLE public.transactions
ADD COLUMN transfer_destination_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 3c. Populate accounts and update transactions
DO $$
DECLARE
    user_record RECORD;
    new_account_id UUID;
BEGIN
    FOR user_record IN SELECT * FROM public.users LOOP
        -- Insert a new account for each user
        INSERT INTO public.accounts (user_id, name, type, currency_code, current_balance)
        VALUES (
            user_record.id, 
            'Main Account', 
            'Cash', 
            COALESCE(user_record.starting_balance_currency_code, user_record.default_currency_code, 'COP'),
            COALESCE(user_record.starting_balance, 0)
        )
        RETURNING id INTO new_account_id;

        -- Update transactions for this user
        UPDATE public.transactions 
        SET account_id = new_account_id 
        WHERE user_id = user_record.id;
    END LOOP;
END $$;

-- 4. Enforce NOT NULL on account_id
-- We only do this if there are no transactions with null account_id. 
-- Since we just updated all of them for every user, it should be fine.
-- However, if there are transactions without users (shouldn't be possible given constraints), they might fail.
-- Let's check constraints. transactions.user_id is NOT NULL. So every transaction has a user.
-- And every user got an account. So every transaction should have an account_id now.

ALTER TABLE public.transactions 
ALTER COLUMN account_id SET NOT NULL;

-- 5. Add indexes for new columns
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_transfer_dest ON public.transactions(transfer_destination_account_id);

-- 6. Cleanup users table
ALTER TABLE public.users
DROP COLUMN starting_balance,
DROP COLUMN starting_balance_date,
DROP COLUMN starting_balance_currency_code;
