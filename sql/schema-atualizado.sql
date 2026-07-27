-- ============================================================
-- SCHEMA ATUALIZADO — adiciona o que falta para o checkout
-- multi-revendedor com Mercado Pago.
--
-- Se você já rodou o schema.sql original, rode só os comandos
-- deste arquivo (são incrementais, não recriam nada).
-- ============================================================

-- 1) Tabela de gateways de pagamento por revendedor
-- Cada revendedor pode conectar Mercado Pago e/ou Expay.
-- O token NUNCA é salvo em texto puro — sempre criptografado
-- (ver lib/crypto.js) antes de chegar aqui.
create table if not exists reseller_payment_gateways (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid references resellers(id) on delete cascade,
  provider text not null,              -- 'mercado_pago' | 'expay'
  access_token_enc text not null,      -- token criptografado (AES-256-GCM)
  active boolean not null default true,
  connected_at timestamptz default now(),
  unique (reseller_id, provider)
);

-- 2) api_accounts precisa da API Key do fornecedor SMM criptografada.
-- Se a tabela já existe com `api_key` em texto puro, migre assim:
alter table api_accounts
  add column if not exists api_key_enc text;

-- (depois de migrar os dados existentes de api_key -> api_key_enc
-- criptografados, você pode rodar: alter table api_accounts drop column api_key;)

-- 3) A tabela orders precisa guardar a referência do pagamento
-- para o webhook conseguir encontrar o pedido certo.
alter table orders
  add column if not exists external_reference text unique,
  add column if not exists link text,
  add column if not exists quantity integer,
  add column if not exists supplier_order_id text;

create index if not exists idx_orders_external_reference
  on orders (external_reference);

-- 4) Preços/serviços que o revendedor ativou e personalizou
-- (referenciado no ServicosView.jsx — ainda não existia como tabela real)
create table if not exists reseller_services (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid references resellers(id) on delete cascade,
  service_id text not null,       -- ID do serviço no painel fornecedor
  network text,
  name text,
  cost numeric(10,2) not null,    -- custo pago ao fornecedor
  sale_price numeric(10,2) not null, -- preço cobrado do cliente final
  active boolean not null default true,
  unique (reseller_id, service_id)
);
