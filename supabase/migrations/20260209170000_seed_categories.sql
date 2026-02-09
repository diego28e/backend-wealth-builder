-- Migration: Seed Category Groups and Categories
-- Date: 2026-02-09

-- 1. Insert default category groups
INSERT INTO category_groups (name, description, sort_order) VALUES
('Income', 'All sources of income', 1),
('Needs', 'Essential expenses (50% rule)', 2), 
('Wants', 'Discretionary expenses (30% rule)', 3),
('Savings', 'Savings and investments (20% rule)', 4)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert system categories with proper grouping
-- We use subqueries to dynamically find the correct category_group_id
INSERT INTO categories (category_group_id, name, description, sort_order) VALUES
-- Income categories
((SELECT id FROM category_groups WHERE name = 'Income'), 'Salary', 'Regular salary/paycheck', 1),
((SELECT id FROM category_groups WHERE name = 'Income'), 'Freelance', 'Freelance/business income', 2),
((SELECT id FROM category_groups WHERE name = 'Income'), 'Investment Income', 'Dividends, interest, capital gains', 3),
((SELECT id FROM category_groups WHERE name = 'Income'), 'Other Income', 'Gifts, refunds, misc income', 4),

-- Needs categories (50%)
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Housing', 'Rent, mortgage, property taxes', 1),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Utilities', 'Electric, water, gas, internet, phone', 2),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Groceries', 'Essential food and household items', 3),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Transportation', 'Car payment, insurance, gas, transit', 4),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Healthcare', 'Insurance, medications, doctor visits', 5),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Minimum Debt Payments', 'Required debt payments', 6),
((SELECT id FROM category_groups WHERE name = 'Needs'), 'Childcare', 'Essential childcare expenses', 7),

-- Wants categories (30%)
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Dining Out', 'Restaurants, coffee, bars, delivery', 1),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Entertainment', 'Streaming, movies, concerts, games', 2),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Shopping', 'Clothing, electronics, home goods, gifts', 3),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Personal Care', 'Gym, salon, grooming, subscriptions', 4),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Travel', 'Vacations, flights, hotels', 5),
((SELECT id FROM category_groups WHERE name = 'Wants'), 'Hobbies', 'Sports, hobbies, recreational activities', 6),

-- Savings categories (20%)
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Emergency Fund', 'Emergency savings fund', 1),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Retirement', '401k, IRA, retirement accounts', 2),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Investments', 'Brokerage, stocks, bonds', 3),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Savings Goals', 'House down payment, car fund, etc', 4),
((SELECT id FROM category_groups WHERE name = 'Savings'), 'Extra Debt Payment', 'Additional debt payments beyond minimum', 5)
ON CONFLICT (name) WHERE (user_id IS NULL) DO NOTHING;
