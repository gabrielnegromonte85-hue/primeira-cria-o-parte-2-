-- Schema sugerido (Supabase / Postgres) para o Painel Master
-- Ajuste nomes/tipos conforme o restante do seu projeto atual.

create table resellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'inicial',        -- 'inicial' | 'pro' | ...
  status text not null default 'healthy',      -- 'healthy' | 'warning' | 'critical' | 'blocked'
  whatsapp text,
  pix_key text,
  store_slug text unique not null,
  password_hash text not null,                 -- login do revendedor
  last_login timestamptz,
  created_at timestamptz default now()
);

create table api_accounts (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid references resellers(id) on delete cascade,
  api_key text not null,
  api_url text not null,
  balance numeric(10,2) not null default 0,
  low_balance_threshold numeric(10,2) not null default 20
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid references resellers(id) on delete cascade,
  type text not null,                           -- 'auto' | 'manual'
  service text,
  amount numeric(10,2) not null,
  status text not null default 'pending',       -- 'pending' | 'completed' | 'failed'
  created_at timestamptz default now()
);

-- View de apoio para o card de faturamento do Painel Master
create view reseller_revenue as
select
  reseller_id,
  sum(amount) filter (where status = 'completed') as total_revenue,
  count(*) filter (where type = 'auto') as auto_orders,
  count(*) filter (where type = 'manual') as manual_orders
from orders
group by reseller_id;
