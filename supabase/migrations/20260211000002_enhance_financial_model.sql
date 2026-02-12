-- 1. Update Transaction Type Enum
-- Postgres doesn't allow easy ADD VALUE in a transaction block usually, requires ALTER TYPE outside.
-- But Supabase/Postgres 12+ supports `ALTER TYPE ... ADD VALUE` inside transactions mostly fine relative to previous versions, 
-- or we handle it by not wrapping in transaction if needed. However, Supabase migrations run in a transaction.
-- We will accept the commit behavior.
ALTER TYPE "public"."transaction_type" ADD VALUE IF NOT EXISTS 'Transfer';

-- 2. Update Accounts Table (Liquidity)
ALTER TABLE "public"."accounts" 
ADD COLUMN IF NOT EXISTS "is_liquid" boolean DEFAULT true;

-- Update existing accounts: Checking/Cash/Savings -> Liquid, Investment/Loan/Other -> Not Liquid (Default assumption)
UPDATE "public"."accounts" 
SET "is_liquid" = false 
WHERE "type" IN ('Investment', 'Loan', 'Other');

-- 3. Create Financial Insights Table
CREATE TABLE IF NOT EXISTS "public"."financial_insights" (
    "id" uuid NOT NULL default extensions.uuid_generate_v4(),
    "user_id" uuid NOT NULL,
    "month" integer NOT NULL,
    "year" integer NOT NULL,
    "total_income" bigint DEFAULT 0,
    "total_expense" bigint DEFAULT 0,
    "savings_rate" numeric(5,2),
    "burn_rate" numeric(10,2),
    "ai_analysis" text, -- The generated text/markdown
    "ai_recommendations" jsonb, -- Structured recommendations
    "financial_score" integer, -- 0-100
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "financial_insights_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "unique_monthly_insight" UNIQUE ("user_id", "month", "year")
);

-- Grant permissions for the new table
GRANT ALL ON TABLE "public"."financial_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_insights" TO "service_role";

-- 4. Category Updates
-- Remove 'Savings Goals' as requested (Too ambiguous)
DELETE FROM "public"."categories" 
WHERE "name" = 'Savings Goals' 
AND "is_system" = true;

-- Add New Categories
INSERT INTO "public"."categories" ("category_group_id", "name", "description", "sort_order") VALUES
-- Needs
((SELECT id FROM "public"."category_groups" WHERE name = 'Needs'), 'Vehicle Maintenance', 'Repairs, oil changes, tires', 8),
((SELECT id FROM "public"."category_groups" WHERE name = 'Needs'), 'Home Maintenance', 'Repairs, cleaning, upkeep', 9),
((SELECT id FROM "public"."category_groups" WHERE name = 'Needs'), 'Education', 'Tuition, books, courses', 10),

-- Wants
((SELECT id FROM "public"."category_groups" WHERE name = 'Wants'), 'Electronics', 'Gadgets, computers, software', 7),
((SELECT id FROM "public"."category_groups" WHERE name = 'Wants'), 'Services', 'Tailor, dry cleaning, etc.', 8)

ON CONFLICT ("name") WHERE ("user_id" IS NULL) DO NOTHING;
