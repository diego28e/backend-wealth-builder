-- Migration: Seed Currencies
-- Date: 2026-02-09

-- Insert default currencies if they don't exist
INSERT INTO public.currencies (code, name, symbol, decimal_digits)
VALUES 
    ('COP', 'Colombian Peso', '$', 0),
    ('USD', 'US Dollar', '$', 2),
    ('EUR', 'Euro', '€', 2),
    ('CNY', 'Chinese Yuan', '¥', 2),
    ('JPY', 'Japanese Yen', '¥', 0)
ON CONFLICT (code) DO NOTHING;
