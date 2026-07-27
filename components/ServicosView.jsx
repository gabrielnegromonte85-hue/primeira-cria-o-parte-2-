'use client';

/**
 * Tela de Serviços — Área do Revendedor
 * -------------------------------------------------------
 * Os serviços vêm importados automaticamente da API do fornecedor
 * (custo fixo definido por eles). O revendedor só:
 *   1. Ativa/desativa quais quer vender na própria loja
 *   2. Define o preço de venda (valor fixo) de cada um
 *
 * Como integrar no RevendedorPainel.jsx:
 *   import ServicosView from '../components/ServicosView';
 *   {active === 'servicos' && <ServicosView />}
 *
 * DADOS MOCADOS: troque `MOCK_SERVICES` pela importação real da API do
 * fornecedor + os overrides salvos em uma tabela `reseller_services`
 * (reseller_id, service_id, sale_price, active) no Supabase.
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

const NETWORKS = ['Instagram', 'Facebook', 'Kwai', 'TikTok'];

const MOCK_SERVICES = [
  { id: 's1', network: 'Instagram', name: 'Seguidores Brasileiros', cost: 8.5, salePrice: 14.9, active: true },
  { id: 's2', network: 'Instagram', name: 'Curtidas', cost: 2.0, salePrice: 4.9, active: true },
  { id: 's3', network: 'Instagram', name: 'Visualizações Reels', cost: 1.2, salePrice: 3.5, active: false },
  { id: 's4', network: 'Facebook', name: 'Curtidas na Página', cost: 6.0, salePrice: 11.9, active: true },
  { id: 's5', network: 'Facebook', name: 'Seguidores', cost: 7.0, salePrice: 12.9, active: false },
  { id: 's6', network: 'Kwai', name: 'Seguidores', cost: 9.0, salePrice: 15.9, active: true },
  { id: 's7', network: 'Kwai', name: 'Curtidas', cost: 3.0, salePrice: 6.9, active: false },
  { id: 's8', network: 'TikTok', name: 'Seguidores', cost: 10.0, salePrice: 17.9, active: true },
];

const currency = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function ServiceRow({ service, onToggle, onPriceChange }) {
  const margin = service.salePrice - service.cost;
  const marginColor = margin <= 0 ? COLORS.critical : margin < service.cost * 0.3 ? COLORS.warning : COLORS.healthy;

  return (
    <div
      style={{ borderColor: COLORS.border, opacity: service.active ? 1 : 0.55 }}
      className="grid grid-cols-12 items-center gap-3 px-5 py-4 border-b last:border-b-0"
    >
      <div className="col-span-4">
        <div style={{ color: COLORS.textPrimary }} className="text-sm">{service.name}</div>
        <div style={{ color: COLORS.textSecondary }} className="text-xs mt-0.5">{service.network}</div>
      </div>

      <div className="col-span-2">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Custo (API)</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textSecondary }} className="text-sm">
          {currency(service.cost)}
        </div>
      </div>

      <div className="col-span-3">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Preço de venda</div>
        <div className="flex items-center gap-1">
          <span style={{ color: COLORS.textSecondary }} className="text-sm">R$</span>
          <input
            type="number"
            step="0.1"
            value={service.salePrice}
            onChange={(e) => onPriceChange(service.id, parseFloat(e.target.value) || 0)}
            style={{
              background: COLORS.surfaceHover,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
            className="w-20 text-sm rounded-md border px-2 py-1"
          />
        </div>
      </div>

      <div className="col-span-1">
        <div style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide mb-1">Margem</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: marginColor }} className="text-sm">
          {currency(margin)}
        </div>
      </div>

      <div className="col-span-2 flex justify-end">
        <button
          onClick={() => onToggle(service.id)}
          style={{
            background: service.active ? COLORS.healthy : COLORS.border,
          }}
          className="w-10 h-5 rounded-full relative transition"
        >
          <span
            style={{
              background: COLORS.bg,
              left: service.active ? '22px' : '2px',
            }}
            className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          />
        </button>
      </div>
    </div>
  );
}

export default function ServicosView() {
  const [services, setServices] = useState(MOCK_SERVICES);
  const [networkFilter, setNetworkFilter] = useState('all');

  const filtered = useMemo(
    () => (networkFilter === 'all' ? services : services.filter((s) => s.network === networkFilter)),
    [services, networkFilter]
  );

  const activeCount = services.filter((s) => s.active).length;

  function toggle(id) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    // TODO: salvar em reseller_services (Supabase)
  }

  function changePrice(id, value) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, salePrice: value } : s)));
    // TODO: salvar em reseller_services (Supabase), com debounce
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-wrap gap-2">
          {['all', ...NETWORKS].map((n) => (
            <button
              key={n}
              onClick={() => setNetworkFilter(n)}
              style={{
                background: networkFilter === n ? COLORS.revenue : COLORS.surface,
                color: networkFilter === n ? COLORS.bg : COLORS.textSecondary,
                borderColor: COLORS.border,
              }}
              className="text-xs px-3 py-1.5 rounded-full border transition"
            >
              {n === 'all' ? 'Todas as redes' : n}
            </button>
          ))}
        </div>
        <div style={{ color: COLORS.textSecondary }} className="text-xs">
          {activeCount} de {services.length} ativos
        </div>
      </div>

      <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border overflow-hidden">
        <div
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
          className="grid grid-cols-12 gap-3 px-5 py-3 border-b text-[11px] uppercase tracking-wide"
        >
          <div className="col-span-4">Serviço</div>
          <div className="col-span-2">Custo</div>
          <div className="col-span-3">Preço de venda</div>
          <div className="col-span-1">Margem</div>
          <div className="col-span-2 text-right">Ativo</div>
        </div>
        {filtered.map((s) => (
          <ServiceRow key={s.id} service={s} onToggle={toggle} onPriceChange={changePrice} />
        ))}
        {filtered.length === 0 && (
          <div style={{ color: COLORS.textSecondary }} className="text-sm text-center py-10">
            Nenhum serviço nessa rede.
          </div>
        )}
      </div>
    </div>
  );
}
