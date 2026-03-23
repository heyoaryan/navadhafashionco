-- Table to track users interested in out-of-stock products
create table if not exists product_interest (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  name text,
  created_at timestamptz default now(),
  -- prevent duplicate entries per user/email per product
  unique(product_id, user_id),
  unique(product_id, email)
);

-- RLS
alter table product_interest enable row level security;

-- Users can insert their own interest
create policy "Users can register interest"
  on product_interest for insert
  with check (auth.uid() = user_id or user_id is null);

-- Users can see their own entries
create policy "Users can view own interest"
  on product_interest for select
  using (auth.uid() = user_id);

-- Admins can see all
create policy "Admins can view all interest"
  on product_interest for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Admins can delete
create policy "Admins can delete interest"
  on product_interest for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Index for fast lookups
create index if not exists idx_product_interest_product_id on product_interest(product_id);
create index if not exists idx_product_interest_user_id on product_interest(user_id);
