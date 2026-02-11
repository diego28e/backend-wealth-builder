-- Create enum for goal status
CREATE TYPE public.financial_goal_status AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED');

-- Add status column to financial_goals table
ALTER TABLE public.financial_goals
ADD COLUMN status public.financial_goal_status NOT NULL DEFAULT 'ACTIVE';

-- Create index for faster filtering by status
CREATE INDEX idx_financial_goals_status ON public.financial_goals(status);
