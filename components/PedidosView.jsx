'use client';

/**
 * Tela de Pedidos — Área do Revendedor
 * -------------------------------------------------------
 * Recebe `initialOrders` (linhas reais de `orders`, buscadas no servidor
 * por app/painel/page.jsx) em vez de dados mocados. Confirmar pedido
 * manual agora chama api/confirm-manual-order.js de verdade.
 */

import { useMemo, useState } from 'react';

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
  pending: { label: 'Pendente', color: COLORS.warning },
  processing: { label: 'Em andamento', color: COLORS.revenue },
  completed: { label: 'Concluído', color: COLORS.healthy },
  failed: { label: 'Falhou', color: COLORS.critical },
};

const currency = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Converte a linha do Supabase (snake_case) pro formato que a tela usa
function fromRow(row) {
  return {
    id: row.id,
    type: row.type,
    service: row.service,
    link: row.link,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
  };
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      style={{ background: `${meta.color}22`, color: meta.color }}
      className="text-[11px] px-2 py-1 rounded-full font-medium"
    >
      {meta.label}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span
      style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
      className="text-[11px] px-2 py-1 rounded-full border"
    >
      {type === 'auto' ? 'Automático · API' : 'Manual · WhatsApp'}
    </span>
  );
}

export default function PedidosView({ initialOrders = [] }) {
  const [orders, setOrders] = useState(() => initialOrders.map(fromRow));
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (typeFilter !== 'all' && o.type !== typeFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, typeFilter, statusFilter]);

  async function confirmManualOrder(id) {
    setConfirmingId(id);
    setError(null);
    try {
      const res = await fetch('/api/confirm-manual-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível confirmar este pedido.');
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'processing' } : o)));
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['all', 'auto', 'manual'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              background: typeFilter === t ? COLORS.revenue : COLORS.surface,
              color: typeFilter === t ? COLORS.bg : COLORS.textSecondary,
              borderColor: COLORS.border,
            }}
            className="text-xs px-3 py-1.5 rounded-full border transition"
          >
            {t === 'all' ? 'Todos os tipos' : t === 'auto' ? 'Automáticos' : 'Manuais'}
          </button>
        ))}
        <span style={{ color: COLORS.border }} className="mx-1">|</span>
        {['all', 'pending', 'processing', 'completed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              background: statusFilter === s ? COLORS.surfaceHover : COLORS.surface,
              color: statusFilter === s ? COLORS.textPrimary : COLORS.textSecondary,
              borderColor: COLORS.border,
            }}
            className="text-xs px-3 py-1.5 rounded-full border transition"
          >
            {s === 'all' ? 'Todos os status' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
          className="rounded-lg border px-4 py-3 text-sm mb-4"
        >
          {error}
        </div>
      )}

      {/* Tabela de pedidos */}
      <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border overflow-hidden">
        <div
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
          className="grid grid-cols-12 gap-3 px-5 py-3 border-b text-[11px] uppercase tracking-wide"
        >
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Serviço</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Valor</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Data</div>
        </div>

        {filtered.map((o) => (
          <div
            key={o.id}
            style={{ borderColor: COLORS.border }}
            className="grid grid-cols-12 gap-3 items-center px-5 py-4 border-b last:border-b-0"
          >
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textSecondary }} className="col-span-1 text-xs">
              #{String(o.id).slice(0, 8)}
            </div>
            <div className="col-span-3">
              <div style={{ color: COLORS.textPrimary }} className="text-sm">{o.service}</div>
              <div style={{ color: COLORS.textSecondary }} className="text-xs mt-0.5">{o.link}</div>
            </div>
            <div className="col-span-2"><TypeBadge type={o.type} /></div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.revenue }} className="col-span-2 text-sm">
              {currency(o.amount)}
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <StatusBadge status={o.status} />
              {o.type === 'manual' && o.status === 'pending' && (
                <button
                  onClick={() => confirmManualOrder(o.id)}
                  disabled={confirmingId === o.id}
                  style={{ color: COLORS.healthy, opacity: confirmingId === o.id ? 0.6 : 1 }}
                  className="text-[11px] underline underline-offset-2 disabled:cursor-not-allowed"
                >
                  {confirmingId === o.id ? 'Confirmando…' : 'Confirmar'}
                </button>
              )}
            </div>
            <div style={{ color: COLORS.textSecondary }} className="col-span-2 text-xs text-right">
              {formatDate(o.createdAt)}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ color: COLORS.textSecondary }} className="text-sm text-center py-10">
            Nenhum pedido encontrado com esse filtro.
          </div>
        )}
      </div>
    </div>
  );
}
