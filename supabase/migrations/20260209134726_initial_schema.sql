create type "public"."category_group_type" as enum ('Income', 'Needs', 'Wants', 'Savings');

create type "public"."transaction_type" as enum ('Income', 'Expense');

create type "public"."user_profile_type" as enum ('Low-Income', 'High-Income/High-Expense', 'Wealth-Builder');


  create table "public"."categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "name" character varying(100) not null,
    "parent_id" uuid,
    "category_group_id" uuid,
    "description" text,
    "is_active" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "is_system" boolean generated always as ((user_id IS NULL)) stored
      );



  create table "public"."category_groups" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" public.category_group_type not null,
    "description" text,
    "sort_order" integer not null default 0
      );



  create table "public"."currencies" (
    "code" character(3) not null,
    "name" character varying(100) not null,
    "symbol" character varying(5) not null,
    "decimal_digits" integer not null
      );



  create table "public"."financial_goals" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" character varying(255) not null,
    "description" text,
    "target_date" date,
    "category_id" uuid,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "target_amount" bigint,
    "current_amount" bigint not null default 0,
    "currency_code" character(3) not null
      );



  create table "public"."transaction_items" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "transaction_id" uuid not null,
    "item_name" character varying not null,
    "quantity" numeric(10,3) not null default 1,
    "unit_price" bigint not null,
    "total_amount" bigint not null,
    "category_id" uuid,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."transactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "category_id" uuid not null,
    "date" timestamp with time zone not null,
    "type" public.transaction_type not null,
    "description" text not null default ''::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "goal_id" uuid,
    "notes" text,
    "amount" bigint not null,
    "currency_code" character(3) not null,
    "receipt_image_url" text,
    "receipt_processed_at" timestamp with time zone,
    "merchant_name" character varying,
    "has_line_items" boolean default false
      );



  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" character varying(255) not null,
    "profile" public.user_profile_type not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "password_hash" character varying(255) not null,
    "first_name" character varying(100) not null,
    "last_name" character varying(100) not null,
    "default_currency_code" character(3) not null default 'COP'::bpchar,
    "starting_balance" bigint default 0,
    "starting_balance_date" timestamp with time zone default now(),
    "starting_balance_currency_code" character(3) default 'COP'::bpchar
      );


CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX category_groups_name_key ON public.category_groups USING btree (name);

CREATE UNIQUE INDEX category_groups_pkey ON public.category_groups USING btree (id);

CREATE UNIQUE INDEX currencies_pkey ON public.currencies USING btree (code);

CREATE UNIQUE INDEX financial_goals_pkey ON public.financial_goals USING btree (id);

CREATE INDEX idx_categories_group ON public.categories USING btree (category_group_id);

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);

CREATE INDEX idx_categories_user ON public.categories USING btree (user_id);

CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items USING btree (transaction_id);

CREATE INDEX idx_transactions_goal ON public.transactions USING btree (goal_id);

CREATE INDEX idx_transactions_user_date ON public.transactions USING btree (user_id, date DESC);

CREATE UNIQUE INDEX transaction_items_pkey ON public.transaction_items USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX unique_system_category ON public.categories USING btree (name) WHERE (user_id IS NULL);

CREATE UNIQUE INDEX unique_user_category ON public.categories USING btree (user_id, name);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."category_groups" add constraint "category_groups_pkey" PRIMARY KEY using index "category_groups_pkey";

alter table "public"."currencies" add constraint "currencies_pkey" PRIMARY KEY using index "currencies_pkey";

alter table "public"."financial_goals" add constraint "financial_goals_pkey" PRIMARY KEY using index "financial_goals_pkey";

alter table "public"."transaction_items" add constraint "transaction_items_pkey" PRIMARY KEY using index "transaction_items_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."categories" add constraint "categories_category_group_id_fkey" FOREIGN KEY (category_group_id) REFERENCES public.category_groups(id) not valid;

alter table "public"."categories" validate constraint "categories_category_group_id_fkey";

alter table "public"."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_parent_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."categories" add constraint "unique_user_category" UNIQUE using index "unique_user_category";

alter table "public"."category_groups" add constraint "category_groups_name_key" UNIQUE using index "category_groups_name_key";

alter table "public"."financial_goals" add constraint "financial_goals_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."financial_goals" validate constraint "financial_goals_category_id_fkey";

alter table "public"."financial_goals" add constraint "financial_goals_currency_code_fkey" FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT not valid;

alter table "public"."financial_goals" validate constraint "financial_goals_currency_code_fkey";

alter table "public"."financial_goals" add constraint "financial_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."financial_goals" validate constraint "financial_goals_user_id_fkey";

alter table "public"."transaction_items" add constraint "transaction_items_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."transaction_items" validate constraint "transaction_items_category_id_fkey";

alter table "public"."transaction_items" add constraint "transaction_items_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_items" validate constraint "transaction_items_transaction_id_fkey";

alter table "public"."transactions" add constraint "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."transactions" validate constraint "transactions_category_id_fkey";

alter table "public"."transactions" add constraint "transactions_currency_code_fkey" FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT not valid;

alter table "public"."transactions" validate constraint "transactions_currency_code_fkey";

alter table "public"."transactions" add constraint "transactions_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES public.financial_goals(id) not valid;

alter table "public"."transactions" validate constraint "transactions_goal_id_fkey";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

alter table "public"."users" add constraint "users_default_currency_code_fkey" FOREIGN KEY (default_currency_code) REFERENCES public.currencies(code) not valid;

alter table "public"."users" validate constraint "users_default_currency_code_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_starting_balance_currency_fkey" FOREIGN KEY (starting_balance_currency_code) REFERENCES public.currencies(code) not valid;

alter table "public"."users" validate constraint "users_starting_balance_currency_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "postgres";

grant insert on table "public"."categories" to "postgres";

grant references on table "public"."categories" to "postgres";

grant select on table "public"."categories" to "postgres";

grant trigger on table "public"."categories" to "postgres";

grant truncate on table "public"."categories" to "postgres";

grant update on table "public"."categories" to "postgres";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."category_groups" to "anon";

grant insert on table "public"."category_groups" to "anon";

grant references on table "public"."category_groups" to "anon";

grant select on table "public"."category_groups" to "anon";

grant trigger on table "public"."category_groups" to "anon";

grant truncate on table "public"."category_groups" to "anon";

grant update on table "public"."category_groups" to "anon";

grant delete on table "public"."category_groups" to "authenticated";

grant insert on table "public"."category_groups" to "authenticated";

grant references on table "public"."category_groups" to "authenticated";

grant select on table "public"."category_groups" to "authenticated";

grant trigger on table "public"."category_groups" to "authenticated";

grant truncate on table "public"."category_groups" to "authenticated";

grant update on table "public"."category_groups" to "authenticated";

grant delete on table "public"."category_groups" to "postgres";

grant insert on table "public"."category_groups" to "postgres";

grant references on table "public"."category_groups" to "postgres";

grant select on table "public"."category_groups" to "postgres";

grant trigger on table "public"."category_groups" to "postgres";

grant truncate on table "public"."category_groups" to "postgres";

grant update on table "public"."category_groups" to "postgres";

grant delete on table "public"."category_groups" to "service_role";

grant insert on table "public"."category_groups" to "service_role";

grant references on table "public"."category_groups" to "service_role";

grant select on table "public"."category_groups" to "service_role";

grant trigger on table "public"."category_groups" to "service_role";

grant truncate on table "public"."category_groups" to "service_role";

grant update on table "public"."category_groups" to "service_role";

grant delete on table "public"."currencies" to "anon";

grant insert on table "public"."currencies" to "anon";

grant references on table "public"."currencies" to "anon";

grant select on table "public"."currencies" to "anon";

grant trigger on table "public"."currencies" to "anon";

grant truncate on table "public"."currencies" to "anon";

grant update on table "public"."currencies" to "anon";

grant delete on table "public"."currencies" to "authenticated";

grant insert on table "public"."currencies" to "authenticated";

grant references on table "public"."currencies" to "authenticated";

grant select on table "public"."currencies" to "authenticated";

grant trigger on table "public"."currencies" to "authenticated";

grant truncate on table "public"."currencies" to "authenticated";

grant update on table "public"."currencies" to "authenticated";

grant delete on table "public"."currencies" to "postgres";

grant insert on table "public"."currencies" to "postgres";

grant references on table "public"."currencies" to "postgres";

grant select on table "public"."currencies" to "postgres";

grant trigger on table "public"."currencies" to "postgres";

grant truncate on table "public"."currencies" to "postgres";

grant update on table "public"."currencies" to "postgres";

grant delete on table "public"."currencies" to "service_role";

grant insert on table "public"."currencies" to "service_role";

grant references on table "public"."currencies" to "service_role";

grant select on table "public"."currencies" to "service_role";

grant trigger on table "public"."currencies" to "service_role";

grant truncate on table "public"."currencies" to "service_role";

grant update on table "public"."currencies" to "service_role";

grant delete on table "public"."financial_goals" to "anon";

grant insert on table "public"."financial_goals" to "anon";

grant references on table "public"."financial_goals" to "anon";

grant select on table "public"."financial_goals" to "anon";

grant trigger on table "public"."financial_goals" to "anon";

grant truncate on table "public"."financial_goals" to "anon";

grant update on table "public"."financial_goals" to "anon";

grant delete on table "public"."financial_goals" to "authenticated";

grant insert on table "public"."financial_goals" to "authenticated";

grant references on table "public"."financial_goals" to "authenticated";

grant select on table "public"."financial_goals" to "authenticated";

grant trigger on table "public"."financial_goals" to "authenticated";

grant truncate on table "public"."financial_goals" to "authenticated";

grant update on table "public"."financial_goals" to "authenticated";

grant delete on table "public"."financial_goals" to "postgres";

grant insert on table "public"."financial_goals" to "postgres";

grant references on table "public"."financial_goals" to "postgres";

grant select on table "public"."financial_goals" to "postgres";

grant trigger on table "public"."financial_goals" to "postgres";

grant truncate on table "public"."financial_goals" to "postgres";

grant update on table "public"."financial_goals" to "postgres";

grant delete on table "public"."financial_goals" to "service_role";

grant insert on table "public"."financial_goals" to "service_role";

grant references on table "public"."financial_goals" to "service_role";

grant select on table "public"."financial_goals" to "service_role";

grant trigger on table "public"."financial_goals" to "service_role";

grant truncate on table "public"."financial_goals" to "service_role";

grant update on table "public"."financial_goals" to "service_role";

grant delete on table "public"."transaction_items" to "anon";

grant insert on table "public"."transaction_items" to "anon";

grant references on table "public"."transaction_items" to "anon";

grant select on table "public"."transaction_items" to "anon";

grant trigger on table "public"."transaction_items" to "anon";

grant truncate on table "public"."transaction_items" to "anon";

grant update on table "public"."transaction_items" to "anon";

grant delete on table "public"."transaction_items" to "authenticated";

grant insert on table "public"."transaction_items" to "authenticated";

grant references on table "public"."transaction_items" to "authenticated";

grant select on table "public"."transaction_items" to "authenticated";

grant trigger on table "public"."transaction_items" to "authenticated";

grant truncate on table "public"."transaction_items" to "authenticated";

grant update on table "public"."transaction_items" to "authenticated";

grant delete on table "public"."transaction_items" to "postgres";

grant insert on table "public"."transaction_items" to "postgres";

grant references on table "public"."transaction_items" to "postgres";

grant select on table "public"."transaction_items" to "postgres";

grant trigger on table "public"."transaction_items" to "postgres";

grant truncate on table "public"."transaction_items" to "postgres";

grant update on table "public"."transaction_items" to "postgres";

grant delete on table "public"."transaction_items" to "service_role";

grant insert on table "public"."transaction_items" to "service_role";

grant references on table "public"."transaction_items" to "service_role";

grant select on table "public"."transaction_items" to "service_role";

grant trigger on table "public"."transaction_items" to "service_role";

grant truncate on table "public"."transaction_items" to "service_role";

grant update on table "public"."transaction_items" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "postgres";

grant insert on table "public"."transactions" to "postgres";

grant references on table "public"."transactions" to "postgres";

grant select on table "public"."transactions" to "postgres";

grant trigger on table "public"."transactions" to "postgres";

grant truncate on table "public"."transactions" to "postgres";

grant update on table "public"."transactions" to "postgres";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


