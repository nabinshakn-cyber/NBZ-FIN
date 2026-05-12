# Supabase SQL Schema Initialization

Run the following SQL in your Supabase SQL Editor to initialize the required tables.

```sql
-- 1. Users Table (Extensions for profiles)
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Transactions (Unified tracking)
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  currency text not null, -- 'AED' | 'INR'
  category text not null,
  date date not null,
  description text,
  type text not null, -- 'income' | 'expense' | 'lent' | 'borrowed' | 'transfer'
  domain text not null, -- 'personal' | 'business'
  merchant text,
  person text,
  ledger_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Income (Specific views)
create table public.income (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  currency text not null,
  category text,
  date date not null,
  description text
);

-- 4. Expenses (Specific views)
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  currency text not null,
  category text,
  date date not null,
  description text
);

-- 5. Loans (Lent/Borrowed)
create table public.loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal not null,
  currency text not null,
  entity_name text not null, -- Person or Institution
  type text not null, -- 'lent' | 'borrowed'
  due_date date,
  status text default 'pending', -- 'pending' | 'settled'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Repayments
create table public.repayments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans on delete cascade not null,
  amount decimal not null,
  date date not null,
  notes text
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.loans enable row level security;
alter table public.repayments enable row level security;

-- Policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- (Repeat policies for other tables similarly)
create policy "Users can view own loans" on public.loans for select using (auth.uid() = user_id);
create policy "Users can insert own loans" on public.loans for insert with check (auth.uid() = user_id);
```
