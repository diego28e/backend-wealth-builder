-- Enhanced Schema for Robust Financial Management

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create enhanced ENUM types
CREATE TYPE user_profile_type AS ENUM (
    'Low-Income',
    'High-Income/High-Expense', 
    'Wealth-Builder'
);

CREATE TYPE transaction_type AS ENUM (
    'Income',
    'Expense'
);

CREATE TYPE category_group_type AS ENUM (
    'Income',
    'Needs',
    'Wants', 
    'Savings'
);

-- 3. Currencies table
CREATE TABLE currencies (
    code CHARACTER(3) PRIMARY KEY,
    name CHARACTER VARYING NOT NULL,
    symbol CHARACTER VARYING NOT NULL,
    decimal_digits INTEGER NOT NULL
);

-- 4. Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email CHARACTER VARYING UNIQUE NOT NULL,
    password_hash CHARACTER VARYING NOT NULL,
    first_name CHARACTER VARYING NOT NULL,
    last_name CHARACTER VARYING NOT NULL,
    profile user_profile_type NOT NULL,
    default_currency_code CHARACTER(3) NOT NULL DEFAULT 'COP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_default_currency_code_fkey FOREIGN KEY (default_currency_code) REFERENCES currencies(code)
);

-- 6. Category groups table
CREATE TABLE category_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name category_group_type NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 7. Categories table with hierarchy and grouping
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES categories(id),
    category_group_id UUID REFERENCES category_groups(id),
    name CHARACTER VARYING NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT (user_id IS NULL),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Financial goals table
CREATE TABLE financial_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name CHARACTER VARYING NOT NULL,
    description TEXT,
    target_amount BIGINT,
    current_amount BIGINT NOT NULL DEFAULT 0,
    target_date DATE,
    category_id UUID REFERENCES categories(id),
    currency_code CHARACTER(3) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT financial_goals_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES currencies(code)
);

-- 9. Transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    goal_id UUID REFERENCES financial_goals(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount BIGINT NOT NULL,
    type transaction_type NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    notes TEXT,
    currency_code CHARACTER(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transactions_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES currencies(code)
);

-- 10. Insert supported currencies
INSERT INTO currencies (code, name, symbol, decimal_digits) VALUES
('COP', 'Colombian Peso', '$', 0),
('USD', 'US Dollar', '$', 2),
('CNY', 'Chinese Yuan', '¥', 2),
('EUR', 'Euro', '€', 2),
('JPY', 'Japanese Yen', '¥', 0);

-- 11. Insert default category groups
INSERT INTO category_groups (name, description, sort_order) VALUES
('Income', 'All sources of income', 1),
('Needs', 'Essential expenses (50% rule)', 2), 
('Wants', 'Discretionary expenses (30% rule)', 3),
('Savings', 'Savings and investments (20% rule)', 4);

-- 12. Insert system categories with proper grouping
INSERT INTO categories (category_group_id, name, description, is_system, sort_order) VALUES
-- Income categories
((SELECT id FROM category_groups WHERE name = 'Income'), 'Salary', 'Regular salary/paycheck', true, 1),
((SELECT id FROM category_groups WHERE name = 'Income'), 'Freelance', 'Freelance/business income', true, 2),
((SELECT id FROM category_groups WHERE name = 'Income'), 'Investment Income', 'Dividends, interest, capital gains', true, 3),
((SELECT id FROM category_groups WHERE name = 'Income'), 'Other Income', 'Gifts, refunds, misc income', true, 4),

-- Needs categories (50%)
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Housing', 'Rent, mortgage, property taxes', true, 1),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Utilities', 'Electric, water, gas, internet, phone', true, 2),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Groceries', 'Essential food and household items', true, 3),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Transportation', 'Car payment, insurance, gas, transit', true, 4),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Healthcare', 'Insurance, medications, doctor visits', true, 5),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Minimum Debt Payments', 'Required debt payments', true, 6),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Childcare', 'Essential childcare expenses', true, 7),

-- Wants categories (30%)
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Dining Out', 'Restaurants, coffee, bars, delivery', true, 1),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Entertainment', 'Streaming, movies, concerts, games', true, 2),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Shopping', 'Clothing, electronics, home goods, gifts', true, 3),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Personal Care', 'Gym, salon, grooming, subscriptions', true, 4),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Travel', 'Vacations, flights, hotels', true, 5),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Hobbies', 'Sports, hobbies, recreational activities', true, 6),

-- Savings categories (20%)
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Emergency Fund', 'Emergency savings fund', true, 1),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Retirement', '401k, IRA, retirement accounts', true, 2),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Investments', 'Brokerage, stocks, bonds', true, 3),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Savings Goals', 'House down payment, car fund, etc', true, 4),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Extra Debt Payment', 'Additional debt payments beyond minimum', true, 5);

-- 13. Create indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_goal ON transactions(goal_id);
CREATE INDEX idx_categories_group ON categories(category_group_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_user ON categories(user_id);

-- 11. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();