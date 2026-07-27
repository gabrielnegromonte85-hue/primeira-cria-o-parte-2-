'use client';

/**
 * Painel Master — visão geral + gestão de revendedores
 * -------------------------------------------------------
 * Componente pronto para colar em app/painel-master/page.jsx (Next.js App Router)
 * ou adaptar para pages/painel-master.jsx (Pages Router).
 *
 * DADOS MOCADOS: troque `MOCK_RESELLERS` por uma query real ao Supabase, ex:
 *
 *   const { data: resellers } = await supabase
 *     .from('resellers')
 *     .select('*, orders(count), api_accounts(balance)')
 *
 * Sugestão de schema (Supabase / Postgres):
 *   resellers(id, name, plan, status, whatsapp, pix_key, last_login, store_slug)
 *   api_accounts(reseller_id, api_key, api_url, balance, low_balance_threshold)
 *   orders(id, reseller_id, type ['auto'|'manual'], amount, status, created_at)
 *
 * Requer Tailwind configurado no projeto. Fontes carregadas via <link> abaixo —
 * mova para o <head> global (app/layout.jsx) em produção.
 */

import { useMemo, useState } from 'react';

// ---------- Tokens de design (sala de controle / monitoramento) ----------
const COLORS = {
  bg: '#0A0F1C',
  surface: '#121A2B',
  surfaceHover: '#1A2338',
  border: '#232D45',
  textPrimary: '#E7ECF6',
  textSecondary: '#7C8BA8',
  revenue: '#2DD4C8',
  healthy: '#45D483',
  warning: '#F5B942',
  critical: '#F0576B',
};

const STATUS_META = {
  healthy: { label: 'Saudável', color: COLORS.healthy },
  warning: { label: 'Atenção', color: COLORS.warning },
  critical: { label: 'Crítico', color: COLORS.critical },
};

// ---------- Dados mocados (substituir por fetch real) ----------
const MOCK_RESELLERS = [
  {
    id: 'r1', name: 'Turbo Social', plan: 'Pro', status: 'healthy',
    autoOrders: 842, manualOrders: 12, apiBalance: 340.5, apiBalanceMax: 500,
    revenue: 12450.9, lastLogin: '2026-07-25T21:10:00', storeSlug: 'turbosocial',
  },
  {
    id: 'r2', name: 'ViralZone', plan: 'Inicial', status: 'warning',
    autoOrders: 210, manualOrders: 88, apiBalance: 42.0, apiBalanceMax: 300,
    revenue: 3820.0, lastLogin: '2026-07-24T14:32:00', storeSlug: 'viralzone',
  },
  {
    id: 'r3', name: 'BoostBR', plan: 'Pro', status: 'critical',
    autoOrders: 15, manualOrders: 3, apiBalance: 4.2, apiBalanceMax: 400,
    revenue: 890.0, lastLogin: '2026-07-20T09:00:00', storeSlug: 'boostbr',
  },
  {
    id: 'r4', name: 'Fama Digital', plan: 'Inicial', status: 'healthy',
    autoOrders: 501, manualOrders: 40, apiBalance: 190.0, apiBalanceMax: 250,
    revenue: 6710.3, lastLogin: '2026-07-25T18:47:00', storeSlug: 'famadigital',
  },
];

const currency = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------- Anel de saúde (elemento de assinatura) ----------
function HealthRing({ status, size = 44 }) {
  const meta = STATUS_META[status];
  const pct = status === 'healthy' ? 1 : status === 'warning' ? 0.6 : 0.25;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={COLORS.border} strokeWidth="4"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={meta.color} strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function BalanceBar({ value, max }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct < 15 ? COLORS.critical : pct < 40 ? COLORS.warning : COLORS.healthy;
  return (
    <div style={{ background: COLORS.border }} className="h-1.5 w-full rounded-full overflow-hidden">
      <div
        style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }}
        className="h-full rounded-full"
      />
    </div>
  );
}

function ActionsMenu({ reseller, onAction }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { key: 'impersonate', label: 'Entrar como revendedor' },
    { key: 'reset', label: 'Resetar integração' },
    { key: 'api-url', label: 'Trocar URL da API' },
    { key: 'store-link', label: 'Gerar novo link da loja' },
    { key: reseller.status === 'blocked' ? 'unblock' : 'block', label: reseller.status === 'blocked' ? 'Desbloquear conta' : 'Bloquear conta' },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
        className="text-xs px-3 py-1.5 rounded-md border hover:brightness-125 transition"
      >
        Ações ⌄
      </button>
      {open && (
        <div
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border }}
          className="absolute right-0 mt-1 w-56 rounded-lg border shadow-xl z-10 overflow-hidden"
        >
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => { onAction(reseller.id, a.key); setOpen(false); }}
              style={{ color: COLORS.textPrimary }}
              className="block w-full text-left text-sm px-4 py-2.5 hover:brightness-125"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResellerRow({ reseller, onAction }) {
  const meta = STATUS_META[reseller.status];
  return (
    <div
      style={{ borderColor: COLORS.border }}
      className="grid grid-cols-12 items-center gap-4 py-4 px-5 border-b last:border-b-0"
    >
      <div className="col-span-3 flex items-center gap-3">
        <HealthRing status={reseller.status} />
        <div>
          <div style={{ color: COLORS.textPrimary }} className="font-medium text-sm">{reseller.name}</div>
          <div style={{ color: meta.color }} className="text-xs mt-0.5">{meta.label} · plano {reseller.plan}</div>
        </div>
      </div>

      <div className="col-span-2">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Pedidos</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textPrimary }} className="text-sm">
          {reseller.autoOrders} <span style={{ color: COLORS.textSecondary }}>auto</span> · {reseller.manualOrders} <span style={{ color: COLORS.textSecondary }}>manual</span>
        </div>
      </div>

      <div className="col-span-2">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Saldo API</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textPrimary }} className="text-sm mb-1">
          {currency(reseller.apiBalance)}
        </div>
        <BalanceBar value={reseller.apiBalance} max={reseller.apiBalanceMax} />
      </div>

      <div className="col-span-2">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Receita gerada</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.revenue }} className="text-sm">
          {currency(reseller.revenue)}
        </div>
      </div>

      <div className="col-span-1">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Loja</div>
        <a
          href={`/loja/${reseller.storeSlug}`}
          style={{ color: COLORS.revenue }}
          className="text-xs underline underline-offset-2"
        >
          Ver loja
        </a>
      </div>

      <div className="col-span-2 flex justify-end">
        <ActionsMenu reseller={reseller} onAction={onAction} />
      </div>
    </div>
  );
}

export default function PainelMaster() {
  const [resellers, setResellers] = useState(MOCK_RESELLERS);
  const [filter, setFilter] = useState('all');

  const totalRevenue = useMemo(
    () => resellers.reduce((sum, r) => sum + r.revenue, 0),
    [resellers]
  );
  const criticalCount = resellers.filter((r) => r.status === 'critical').length;
  const warningCount = resellers.filter((r) => r.status === 'warning').length;

  const filtered = filter === 'all' ? resellers : resellers.filter((r) => r.status === filter);

  function handleAction(id, action) {
    // TODO: chamar API/Supabase real para cada ação
    console.log('Ação', action, 'no revendedor', id);
    if (action === 'block' || action === 'unblock') {
      setResellers((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action === 'block' ? 'blocked' : 'healthy' } : r))
      );
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }} className="p-6 md:p-10">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div className="max-w-6xl mx-auto">
        {/* Header / faturamento em destaque */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div style={{ color: COLORS.textSecondary }} className="text-xs uppercase tracking-widest mb-2">
              Faturamento total · rede de revendedores
            </div>
            <div
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: COLORS.textPrimary }}
              className="text-4xl md:text-5xl font-bold tracking-tight"
            >
              {currency(totalRevenue)}
            </div>
          </div>

          <div className="flex gap-3">
            <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-lg border px-4 py-3">
              <div style={{ color: COLORS.warning }} className="text-lg font-semibold">{warningCount}</div>
              <div style={{ color: COLORS.textSecondary }} className="text-[11px]">em atenção</div>
            </div>
            <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-lg border px-4 py-3">
              <div style={{ color: COLORS.critical }} className="text-lg font-semibold">{criticalCount}</div>
              <div style={{ color: COLORS.textSecondary }} className="text-[11px]">críticos</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {['all', 'healthy', 'warning', 'critical'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? COLORS.revenue : COLORS.surface,
                color: filter === f ? COLORS.bg : COLORS.textSecondary,
                borderColor: COLORS.border,
              }}
              className="text-xs px-3 py-1.5 rounded-full border capitalize transition"
            >
              {f === 'all' ? 'Todos' : STATUS_META[f].label}
            </button>
          ))}
        </div>

        {/* Lista de revendedores */}
        <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border overflow-hidden">
          <div
            style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
            className="grid grid-cols-12 gap-4 px-5 py-3 border-b text-[11px] uppercase tracking-wide"
          >
            <div className="col-span-3">Revendedor</div>
            <div className="col-span-2">Pedidos</div>
            <div className="col-span-2">Saldo API</div>
            <div className="col-span-2">Receita</div>
            <div className="col-span-1">Loja</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
          {filtered.map((r) => (
            <ResellerRow key={r.id} reseller={r} onAction={handleAction} />
          ))}
          {filtered.length === 0 && (
            <div style={{ color: COLORS.textSecondary }} className="text-sm text-center py-10">
              Nenhum revendedor nesse status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
