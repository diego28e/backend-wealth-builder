-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create custom ENUM types
CREATE TYPE user_profile_type AS ENUM (
    'Low-Income',
    'High-Income/High-Expense',
    'Wealth-Builder'
);

CREATE TYPE transaction_type AS ENUM (
    'Income',
    'Expense'
);

-- 3. Create 'users' table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile user_profile_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create 'goals' and 'user_goals' tables (many-to-many)
CREATE TABLE goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE user_goals (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, goal_id)
);

-- 5. Create 'categories' table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    -- A specific user's categories must have unique names
    CONSTRAINT unique_user_category UNIQUE (user_id, name)
);

-- 6. Create 'transactions' table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create optimized indexes
-- NOTE: Indexes on FKs (user_id, category_id) are created automatically.
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
-- Create partial unique index for system categories (name is unique ONLY when user_id IS NULL)
CREATE UNIQUE INDEX idx_unique_system_category ON categories(name) WHERE (user_id IS NULL);

-- 8. Create 'updated_at' trigger function (your original was perfect)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for 'updated_at'
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Enable Row Level Security (RLS)
--ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
--ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
--ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
--ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 11. Create secure RLS policies (adjust auth.current_user_id() as needed)
-- (See RLS section above for detailed policy examples)
-- Example for transactions:
--CREATE POLICY "Users can manage their own transactions"
    --ON transactions FOR ALL
    --USING (user_id = (SELECT (current_setting('request.jwt.claim.sub', true))::uuid))
    --WITH CHECK (user_id = (SELECT (current_setting('request.jwt.claim.sub', true))::uuid));
    
-- Example for categories:
-- Users can see their own categories AND system categories
--CREATE POLICY "Users can select their own or system categories"
    --ON categories FOR SELECT
    --USING (user_id = (SELECT (current_setting('request.jwt.claim.sub', true))::uuid) OR user_id IS NULL);
-- (Add policies for INSERT, UPDATE, DELETE as needed)