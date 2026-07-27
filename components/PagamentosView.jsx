'use client';

/**
 * Tela de Pagamentos — Área do Revendedor
 * -------------------------------------------------------
 * Cada revendedor conecta o PRÓPRIO gateway de pagamento (Mercado Pago
 * via Access Token, ou Expay). O botão "Desconectar" agora chama
 * POST /api/disconnect-gateway de verdade (antes só mudava o estado
 * local — o token continuava ativo no banco).
 */

import { useEffect, useState } from 'react';

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

const PROVIDERS = [
  { key: 'mercado_pago', name: 'Mercado Pago', field: 'Access Token', hint: 'Encontre em: Seu negócio → Configurações → Credenciais de produção' },
  { key: 'expay', name: 'Expay', field: 'Access Token', hint: 'Encontre no painel da Expay em Integrações → API' },
];

const EMPTY_CONNECTIONS = {
  mercado_pago: { connected: false, active: false, tokenMasked: null, connectedAt: null },
  expay: { connected: false, active: false, tokenMasked: null, connectedAt: null },
};

function GatewayCard({ provider, connection, onConnect, onDisconnect, onToggleActive, isSaving, isDisconnecting }) {
  const [tokenInput, setTokenInput] = useState('');
  const [editing, setEditing] = useState(!connection.connected);

  return (
    <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ color: COLORS.textPrimary }} className="text-sm font-semibold">{provider.name}</div>
          {connection.connected && (
            <div style={{ color: connection.active ? COLORS.healthy : COLORS.textSecondary }} className="text-xs mt-1">
              {connection.active ? '● Conectado e ativo' : '○ Conectado, mas pausado'}
            </div>
          )}
          {!connection.connected && (
            <div style={{ color: COLORS.textSecondary }} className="text-xs mt-1">Não conectado</div>
          )}
        </div>
        {connection.connected && (
          <button
            onClick={() => onToggleActive(provider.key)}
            style={{ background: connection.active ? COLORS.healthy : COLORS.border }}
            className="w-10 h-5 rounded-full relative transition"
          >
            <span
              style={{ background: COLORS.bg, left: connection.active ? '22px' : '2px' }}
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
            />
          </button>
        )}
      </div>

      {connection.connected && !editing ? (
        <div className="flex items-center justify-between">
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textSecondary }} className="text-xs">
            {connection.tokenMasked}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(true)} style={{ color: COLORS.revenue }} className="text-xs underline underline-offset-2">
              Trocar token
            </button>
            <button
              onClick={() => onDisconnect(provider.key)}
              disabled={isDisconnecting}
              style={{ color: COLORS.critical, opacity: isDisconnecting ? 0.6 : 1 }}
              className="text-xs underline underline-offset-2 disabled:cursor-not-allowed"
            >
              {isDisconnecting ? 'Desconectando…' : 'Desconectar'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
            {provider.field}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={`Cole seu ${provider.field} aqui`}
              style={{
                background: COLORS.surfaceHover,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
              className="flex-1 text-sm rounded-md border px-3 py-2"
            />
            <button
              onClick={async () => {
                if (!tokenInput.trim()) return;
                await onConnect(provider.key, tokenInput);
                setTokenInput('');
                setEditing(false);
              }}
              disabled={isSaving}
              style={{ background: COLORS.revenue, color: COLORS.bg, opacity: isSaving ? 0.6 : 1 }}
              className="text-xs px-4 py-2 rounded-md font-medium hover:brightness-110 transition disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          <div style={{ color: COLORS.textSecondary }} className="text-[11px] mt-2">{provider.hint}</div>
        </div>
      )}
    </div>
  );
}

export default function PagamentosView({ resellerId }) {
  const [connections, setConnections] = useState(EMPTY_CONNECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/gateways')
      .then((res) => res.json())
      .then((data) => {
        if (data.connections) setConnections({ ...EMPTY_CONNECTIONS, ...data.connections });
      })
      .catch(() => setError('Não foi possível carregar suas conexões.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect(providerKey, token) {
    setSaving(providerKey);
    setError(null);
    try {
      const res = await fetch('/api/connect-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerKey, accessToken: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível conectar. Tente novamente.');
        return;
      }

      setConnections((prev) => ({
        ...prev,
        [providerKey]: {
          connected: true,
          active: true,
          tokenMasked: data.tokenMasked,
          connectedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSaving(null);
    }
  }

  async function handleDisconnect(providerKey) {
    setDisconnecting(providerKey);
    setError(null);
    try {
      const res = await fetch('/api/disconnect-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível desconectar. Tente novamente.');
        return;
      }

      setConnections((prev) => ({
        ...prev,
        [providerKey]: { connected: false, active: false, tokenMasked: null, connectedAt: null },
      }));
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setDisconnecting(null);
    }
  }

  function handleToggleActive(providerKey) {
    // Pausar/reativar sem desconectar de vez — mantém como estado
    // local por ora (não fazia parte do escopo de segurança pedido;
    // se quiser persistir, é o mesmo padrão do disconnect-gateway.js
    // trocando active para true/false ao invés de sempre false).
    setConnections((prev) => ({
      ...prev,
      [providerKey]: { ...prev[providerKey], active: !prev[providerKey].active },
    }));
  }

  const anyActive = Object.values(connections).some((c) => c.active);

  if (loading) {
    return <div style={{ color: COLORS.textSecondary }} className="text-sm">Carregando…</div>;
  }

  return (
    <div>
      {error && (
        <div
          style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
          className="rounded-lg border px-4 py-3 text-sm mb-6"
        >
          {error}
        </div>
      )}

      {!anyActive && (
        <div
          style={{ background: 'rgba(245,185,66,0.1)', borderColor: COLORS.warning, color: COLORS.warning }}
          className="rounded-lg border px-4 py-3 text-sm mb-6"
        >
          ⚠ Nenhum gateway de pagamento ativo. Sua loja não vai conseguir cobrar clientes até você conectar o Mercado Pago ou a Expay.
        </div>
      )}

      <div style={{ color: COLORS.textSecondary }} className="text-xs mb-4">
        Conecte a conta onde você quer receber diretamente os pagamentos da sua loja.
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => (
          <GatewayCard
            key={p.key}
            provider={p}
            connection={connections[p.key]}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onToggleActive={handleToggleActive}
            isSaving={saving === p.key}
            isDisconnecting={disconnecting === p.key}
          />
        ))}
      </div>
    </div>
  );
}
