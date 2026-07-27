'use client';

/**
 * Área Administrativa do Revendedor
 * -------------------------------------------------------
 * Agora recebe `resellerId` e `resellerName` do Server Component
 * app/painel/page.jsx, que resolve a sessão real (Supabase Auth).
 * Nunca aceite um resellerId vindo de props default/mock em produção.
 *
 * MOCK_DATA continua mockado só para o Dashboard (Pedidos, Serviços
 * de estatísticas do topo) — isso não fazia parte dos 4 itens desta
 * entrega. Configurações, Pagamentos e Serviços já usam dados/():
 *   - Configurações: dados reais (conta, loja, cupons, senha, API)
 *   - Pagamentos: conectar/desconectar gateway real
 *   - Serviços: continua no mock — fora do escopo desta entrega
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import ConfiguracoesView from './ConfiguracoesView';
import PagamentosView from './PagamentosView';
import ServicosView from './ServicosView';

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

const MOCK_DASHBOARD = {
  plan: 'Pro',
  autoOrders: 842,
  manualOrders: 12,
  apiBalance: 42.0,
  apiBalanceMax: 500,
  lowBalanceThreshold: 50,
  revenueMonth: 12450.9,
  pendingOrders: 6,
};

const currency = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '◧' },
  { key: 'pedidos', label: 'Pedidos', icon: '▤' },
  { key: 'servicos', label: 'Serviços', icon: '◈' },
  { key: 'pagamentos', label: 'Pagamentos', icon: '◎' },
  { key: 'config', label: 'Configurações', icon: '⚙' },
];

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border p-5">
      <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-2">{label}</div>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: accent || COLORS.textPrimary }} className="text-2xl font-semibold">
        {value}
      </div>
      {sub && <div style={{ color: COLORS.textSecondary }} className="text-xs mt-1">{sub}</div>}
    </div>
  );
}

function LowBalanceAlert({ balance, threshold }) {
  if (balance > threshold) return null;
  return (
    <div
      style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
      className="rounded-lg border px-4 py-3 text-sm mb-6 flex items-center gap-2"
    >
      ⚠ Seu saldo de API está baixo ({currency(balance)}). Recarregue para evitar interrupção nos pedidos automáticos.
    </div>
  );
}

function DashboardView({ data }) {
  return (
    <>
      <LowBalanceAlert balance={data.apiBalance} threshold={data.lowBalanceThreshold} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pedidos automáticos" value={data.autoOrders} sub="via API" />
        <StatCard label="Pedidos manuais" value={data.manualOrders} sub="via WhatsApp" />
        <StatCard label="Saldo da API" value={currency(data.apiBalance)} accent={data.apiBalance <= data.lowBalanceThreshold ? COLORS.critical : COLORS.healthy} />
        <StatCard label="Faturamento (mês)" value={currency(data.revenueMonth)} accent={COLORS.revenue} />
      </div>
      <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border p-5">
        <div style={{ color: COLORS.textPrimary }} className="text-sm font-medium mb-1">Pedidos pendentes</div>
        <div style={{ color: COLORS.textSecondary }} className="text-xs">
          Você tem <span style={{ color: COLORS.warning }}>{data.pendingOrders}</span> pedidos manuais aguardando confirmação via WhatsApp.
        </div>
      </div>
    </>
  );
}

function PlaceholderView({ title }) {
  return (
    <div style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textSecondary }} className="rounded-xl border p-10 text-center text-sm">
      Tela de "{title}" — a construir na próxima etapa.
    </div>
  );
}

export default function RevendedorPainel({ resellerId, resellerName, storeSlug }) {
  const [active, setActive] = useState('dashboard');
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }} className="flex">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{ background: COLORS.surface, borderColor: COLORS.border }} className="w-56 border-r p-5 hidden md:flex md:flex-col justify-between">
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: COLORS.textPrimary }} className="text-lg font-bold mb-8">
            {resellerName}
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                style={{
                  background: active === item.key ? COLORS.surfaceHover : 'transparent',
                  color: active === item.key ? COLORS.textPrimary : COLORS.textSecondary,
                }}
                className="text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <div style={{ background: COLORS.surfaceHover, borderColor: COLORS.border }} className="rounded-lg border p-3">
            <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Plano</div>
            <div style={{ color: COLORS.revenue }} className="text-sm font-semibold">{MOCK_DASHBOARD.plan}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ color: COLORS.textSecondary, borderColor: COLORS.border }}
            className="text-xs px-3 py-2 rounded-md border hover:brightness-125 transition"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: COLORS.textPrimary }} className="text-2xl font-bold capitalize">
              {NAV_ITEMS.find((n) => n.key === active)?.label}
            </div>
            <div className="flex gap-2">
              <a
                href={`/loja/${storeSlug}`}
                style={{ background: COLORS.revenue, color: COLORS.bg }}
                className="text-xs px-3 py-2 rounded-md font-medium hover:brightness-110 transition"
              >
                Ver Loja
              </a>
            </div>
          </div>

          {active === 'dashboard' && <DashboardView data={MOCK_DASHBOARD} />}
          {active === 'servicos' && <ServicosView />}
          {active === 'pagamentos' && <PagamentosView resellerId={resellerId} />}
          {active === 'config' && <ConfiguracoesView resellerId={resellerId} />}
          {active === 'pedidos' && <PlaceholderView title="Pedidos" />}
        </div>
      </main>
    </div>
  );
}
