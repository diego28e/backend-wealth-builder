-- Create a function to update account balance
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.accounts
    SET current_balance = current_balance + (
      CASE 
        WHEN NEW.type = 'Income' THEN NEW.amount
        ELSE -NEW.amount
      END
    ),
    updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Revert old amount
    UPDATE public.accounts
    SET current_balance = current_balance - (
      CASE 
        WHEN OLD.type = 'Income' THEN OLD.amount
        ELSE -OLD.amount
      END
    )
    WHERE id = OLD.account_id;
    
    -- Apply new amount
    UPDATE public.accounts
    SET current_balance = current_balance + (
      CASE 
        WHEN NEW.type = 'Income' THEN NEW.amount
        ELSE -NEW.amount
      END
    ),
    updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
    
  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.accounts
    SET current_balance = current_balance - (
      CASE 
        WHEN OLD.type = 'Income' THEN OLD.amount
        ELSE -OLD.amount
      END
    ),
    updated_at = NOW()
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on transactions table
DROP TRIGGER IF exists update_account_balance_trigger ON public.transactions;
CREATE TRIGGER update_account_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance();
