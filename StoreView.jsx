'use client';

/**
 * StoreView — vitrine pública da loja de um revendedor
 * -------------------------------------------------------
 * Recebe os dados já buscados no servidor (page.jsx) via props.
 * Mantém a mesma identidade visual do resto do produto (fundo escuro,
 * acento turquesa, Space Grotesk + Inter + IBM Plex Mono), mas com um
 * layout de vitrine — não de painel administrativo.
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

const NETWORK_META = {
  Instagram: { icon: '◎', color: '#E1306C' },
  Facebook: { icon: '◫', color: '#1877F2' },
  TikTok: { icon: '♪', color: '#69C9D0' },
  Kwai: { icon: '▶', color: '#FF6C00' },
};

const currency = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function ServiceCard({ service, onSelect }) {
  const meta = NETWORK_META[service.network] || { icon: '●', color: COLORS.revenue };
  return (
    <button
      onClick={() => onSelect(service)}
      style={{ background: COLORS.surface, borderColor: COLORS.border }}
      className="text-left rounded-xl border p-5 hover:brightness-110 transition group w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          style={{ background: `${meta.color}22`, color: meta.color }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
        >
          {meta.icon}
        </span>
        <span style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide">
          {service.network}
        </span>
      </div>
      <div style={{ color: COLORS.textPrimary }} className="text-sm font-medium mb-1">
        {service.name}
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.revenue }} className="text-lg font-semibold">
        {currency(service.sale_price)} <span style={{ color: COLORS.textSecondary }} className="text-xs font-normal">/ 1000</span>
      </div>
    </button>
  );
}

function CheckoutPanel({ service, storeSlug, onClose }) {
  const [quantity, setQuantity] = useState(1000);
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = useMemo(
    () => (Number(service.sale_price) * Number(quantity || 0)) / 1000,
    [service.sale_price, quantity]
  );

  async function submit() {
    if (!link.trim() || !quantity || quantity < 1) {
      setError('Preencha o link do perfil e a quantidade.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-order-mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          serviceId: service.service_id,
          link,
          quantity,
          buyerEmail: email || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível iniciar o pagamento.');
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ background: 'rgba(10,15,28,0.85)' }}
      className="fixed inset-0 z-20 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div style={{ color: COLORS.textSecondary }} className="text-xs uppercase tracking-wide mb-1">
              {service.network}
            </div>
            <div style={{ color: COLORS.textPrimary }} className="text-base font-semibold">{service.name}</div>
          </div>
          <button onClick={onClose} style={{ color: COLORS.textSecondary }} className="text-xl leading-none">
            ×
          </button>
        </div>

        {error && (
          <div
            style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
            className="rounded-lg border px-3 py-2 text-xs mb-4"
          >
            {error}
          </div>
        )}

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          Link do perfil ou publicação
        </label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="@seuperfil ou link completo"
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full text-sm rounded-md border px-3 py-2 mb-4"
        />

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          Quantidade
        </label>
        <input
          type="number"
          min={100}
          step={100}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full text-sm rounded-md border px-3 py-2 mb-4"
        />

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          E-mail para receber a confirmação
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full text-sm rounded-md border px-3 py-2 mb-5"
        />

        <div className="flex items-center justify-between mb-4">
          <span style={{ color: COLORS.textSecondary }} className="text-xs">Total</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.revenue }} className="text-xl font-semibold">
            {currency(total)}
          </span>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{ background: COLORS.revenue, color: COLORS.bg, opacity: loading ? 0.6 : 1 }}
          className="w-full text-sm font-medium py-3 rounded-lg hover:brightness-110 transition disabled:cursor-not-allowed"
        >
          {loading ? 'Redirecionando para pagamento…' : 'Pagar com Mercado Pago'}
        </button>
      </div>
    </div>
  );
}

export default function StoreView({ storeSlug, storeName, services, hasActivePayment }) {
  const [networkFilter, setNetworkFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);

  const networks = useMemo(
    () => ['all', ...new Set(services.map((s) => s.network))],
    [services]
  );

  const filtered = useMemo(
    () => (networkFilter === 'all' ? services : services.filter((s) => s.network === networkFilter)),
    [services, networkFilter]
  );

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header / hero */}
      <div style={{ borderColor: COLORS.border }} className="border-b px-6 md:px-10 py-10 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div style={{ color: COLORS.revenue }} className="text-xs uppercase tracking-widest mb-3">
            {storeName}
          </div>
          <h1
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: COLORS.textPrimary }}
            className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl"
          >
            Cresça suas redes com segurança e rapidez
          </h1>
          <p style={{ color: COLORS.textSecondary }} className="text-sm md:text-base mt-4 max-w-lg">
            Escolha a rede, o serviço e a quantidade. Seu pedido entra em processamento
            assim que o pagamento é confirmado.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-10">
        {!hasActivePayment && (
          <div
            style={{ background: 'rgba(245,185,66,0.1)', borderColor: COLORS.warning, color: COLORS.warning }}
            className="rounded-lg border px-4 py-3 text-sm mb-8"
          >
            Esta loja está temporariamente indisponível para novos pedidos.
          </div>
        )}

        {/* Filtro por rede */}
        <div className="flex flex-wrap gap-2 mb-6">
          {networks.map((n) => (
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

        {/* Grid de serviços */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <ServiceCard key={s.service_id} service={s} onSelect={hasActivePayment ? setSelectedService : () => {}} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ color: COLORS.textSecondary }} className="text-sm text-center py-16">
            Nenhum serviço disponível nessa rede no momento.
          </div>
        )}
      </div>

      {selectedService && (
        <CheckoutPanel
          service={selectedService}
          storeSlug={storeSlug}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
