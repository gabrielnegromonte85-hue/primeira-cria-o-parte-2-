-- ============================================================
-- MIGRAÇÃO — Autenticação real (Supabase Auth) + RLS
-- Rode isso no SQL Editor do Supabase, depois de já ter rodado
-- schema.sql e schema-atualizado.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Ligar cada revendedor a um usuário do Supabase Auth
-- ------------------------------------------------------------
-- A partir de agora, quem autentica é o Supabase Auth (auth.users).
-- A tabela `resellers` só guarda o PERFIL do revendedor, ligado ao
-- usuário autenticado via `user_id`.

alter table resellers
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists resellers_user_id_key
  on resellers (user_id);

-- password_hash não é mais usado (o Supabase Auth cuida da senha).
-- Não apago a coluna agora pra não quebrar nada que ainda dependa
-- dela — depois de confirmar que o login novo está 100% funcionando,
-- rode:
--   alter table resellers drop column password_hash;
alter table resellers
  alter column password_hash drop not null;

-- ------------------------------------------------------------
-- 1.1) Campos da "Loja" que o ConfiguracoesView.jsx precisa salvar
--      e que ainda não existiam na tabela `resellers`.
-- ------------------------------------------------------------
alter table resellers
  add column if not exists store_name text,
  add column if not exists slogan text;

-- ------------------------------------------------------------
-- 2) Tabela de cupons (faltava mesmo, usada só como MOCK_COUPONS
--    no ConfiguracoesView.jsx)
-- ------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid references resellers(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null,
  max_uses integer,
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  unique (reseller_id, code)
);

-- ------------------------------------------------------------
-- 3) RLS — Row Level Security
-- ------------------------------------------------------------
-- Importante: suas API routes usam a SERVICE ROLE KEY
-- (lib/supabaseAdmin.js), que sempre IGNORA RLS. Ou seja, RLS aqui
-- não substitui a validação de sessão dentro das API routes — ela é
-- uma segunda camada de proteção, essencial para o dia em que algum
-- componente cliente passar a consultar o Supabase diretamente com a
-- chave anon (ex: um dashboard React puro, sem passar pela API).
-- Sem RLS, a chave anon consegue ler/escrever QUALQUER linha de
-- QUALQUER revendedor.

alter table resellers enable row level security;
alter table api_accounts enable row level security;
alter table orders enable row level security;
alter table reseller_payment_gateways enable row level security;
alter table reseller_services enable row level security;
alter table coupons enable row level security;

-- --- resellers: cada revendedor só enxerga/edita a própria linha ---
drop policy if exists "reseller_select_own" on resellers;
create policy "reseller_select_own" on resellers
  for select using (user_id = auth.uid());

drop policy if exists "reseller_update_own" on resellers;
create policy "reseller_update_own" on resellers
  for update using (user_id = auth.uid());

-- --- tabelas filhas: acesso só ao que pertence ao próprio reseller_id ---
drop policy if exists "api_accounts_own" on api_accounts;
create policy "api_accounts_own" on api_accounts
  for all using (
    reseller_id in (select id from resellers where user_id = auth.uid())
  );

drop policy if exists "orders_own" on orders;
create policy "orders_own" on orders
  for select using (
    reseller_id in (select id from resellers where user_id = auth.uid())
  );

drop policy if exists "gateways_own" on reseller_payment_gateways;
create policy "gateways_own" on reseller_payment_gateways
  for all using (
    reseller_id in (select id from resellers where user_id = auth.uid())
  );

drop policy if exists "services_own" on reseller_services;
create policy "services_own" on reseller_services
  for all using (
    reseller_id in (select id from resellers where user_id = auth.uid())
  );

drop policy if exists "coupons_own" on coupons;
create policy "coupons_own" on coupons
  for all using (
    reseller_id in (select id from resellers where user_id = auth.uid())
  );

-- Observação: a página pública da loja (/loja/[slug]) e os webhooks
-- de pagamento continuam funcionando normalmente, porque eles usam
-- supabaseAdmin (service role), que ignora RLS por definição.
