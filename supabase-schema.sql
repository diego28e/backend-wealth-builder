-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name character varying NOT NULL,
  parent_id uuid,
  category_group_id uuid,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  is_system boolean DEFAULT (user_id IS NULL),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id),
  CONSTRAINT categories_category_group_id_fkey FOREIGN KEY (category_group_id) REFERENCES public.category_groups(id)
);
CREATE TABLE public.category_groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name USER-DEFINED NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT category_groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.currencies (
  code character NOT NULL,
  name character varying NOT NULL,
  symbol character varying NOT NULL,
  decimal_digits integer NOT NULL,
  CONSTRAINT currencies_pkey PRIMARY KEY (code)
);
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  target_date date,
  category_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  target_amount bigint,
  current_amount bigint NOT NULL DEFAULT 0,
  currency_code character NOT NULL,
  CONSTRAINT financial_goals_pkey PRIMARY KEY (id),
  CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT financial_goals_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT financial_goals_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  date timestamp with time zone NOT NULL,
  type USER-DEFINED NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  goal_id uuid,
  notes text,
  amount bigint NOT NULL,
  currency_code character NOT NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT transactions_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.financial_goals(id),
  CONSTRAINT transactions_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  profile USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password_hash character varying NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  default_currency_code character NOT NULL DEFAULT 'COP'::bpchar,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_default_currency_code_fkey FOREIGN KEY (default_currency_code) REFERENCES public.currencies(code)
);