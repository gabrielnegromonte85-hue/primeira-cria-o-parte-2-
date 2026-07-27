'use client';

/**
 * Tela de Configurações — Área do Revendedor
 * -------------------------------------------------------
 * Todas as seções agora persistem de verdade:
 *   - Dados da conta   -> POST /api/save-account
 *   - Loja             -> POST /api/save-store
 *   - API do fornecedor-> POST /api/save-api-account (já existia)
 *   - Cupons           -> GET/POST/PATCH /api/coupons
 *   - Senha            -> POST /api/save-password
 *
 * `resellerId` só é usado para exibição/keys locais — as API routes
 * NUNCA confiam nele vindo do body; o servidor resolve o reseller da
 * própria sessão (ver lib/supabase/api.js).
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

function Section({ title, children }) {
  return (
    <div style={{ background: COLORS.surface, borderColor: COLORS.border }} className="rounded-xl border p-5 mb-5">
      <div style={{ color: COLORS.textPrimary }} className="text-sm font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', masked = false, hint }) {
  return (
    <div className="mb-3 last:mb-0">
      <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <input
        type={masked ? 'password' : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
        className="w-full text-sm rounded-md border px-3 py-2"
      />
      {hint && <div style={{ color: COLORS.textSecondary }} className="text-[11px] mt-1">{hint}</div>}
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Salvar', savingLabel = 'Salvando…' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{ background: COLORS.revenue, color: COLORS.bg, opacity: saving ? 0.6 : 1 }}
      className="text-xs px-4 py-2 rounded-md font-medium hover:brightness-110 transition mt-4 disabled:cursor-not-allowed"
    >
      {saving ? savingLabel : label}
    </button>
  );
}

function FeedbackBanner({ error, success }) {
  if (!error && !success) return null;
  return (
    <div
      style={{
        background: error ? 'rgba(240,87,107,0.1)' : 'rgba(69,212,131,0.1)',
        color: error ? COLORS.critical : COLORS.healthy,
      }}
      className="rounded-lg px-3 py-2 text-xs mb-3"
    >
      {error || success}
    </div>
  );
}

function CouponForm({ onAdd, saving }) {
  const [code, setCode] = useState('');
  const [type, setType] = useState('percent');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');

  function submit() {
    if (!code.trim() || !value) return;
    onAdd({ code: code.toUpperCase(), type, value: parseFloat(value), maxUses: parseInt(maxUses) || null });
    setCode(''); setValue(''); setMaxUses('');
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      <input
        placeholder="CÓDIGO"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
        className="text-sm rounded-md border px-3 py-2 col-span-2 md:col-span-1"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
        className="text-sm rounded-md border px-3 py-2"
      >
        <option value="percent">% desconto</option>
        <option value="fixed">R$ fixo</option>
      </select>
      <input
        placeholder="Valor"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
        className="text-sm rounded-md border px-3 py-2"
      />
      <div className="flex gap-2">
        <input
          placeholder="Máx. usos"
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="text-sm rounded-md border px-3 py-2 w-full"
        />
        <button
          onClick={submit}
          disabled={saving}
          style={{ background: COLORS.revenue, color: COLORS.bg, opacity: saving ? 0.6 : 1 }}
          className="text-xs px-3 rounded-md font-medium whitespace-nowrap hover:brightness-110 transition disabled:cursor-not-allowed"
        >
          Criar
        </button>
      </div>
    </div>
  );
}

function CouponRow({ coupon, onToggle }) {
  return (
    <div style={{ borderColor: COLORS.border, opacity: coupon.active ? 1 : 0.5 }} className="grid grid-cols-12 items-center gap-2 py-3 border-b last:border-b-0">
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textPrimary }} className="col-span-3 text-sm">{coupon.code}</div>
      <div style={{ color: COLORS.revenue }} className="col-span-3 text-sm">
        {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `R$ ${Number(coupon.discount_value).toFixed(2)}`}
      </div>
      <div style={{ color: COLORS.textSecondary }} className="col-span-4 text-xs">
        {coupon.used_count}/{coupon.max_uses ?? '∞'} usos
      </div>
      <div className="col-span-2 flex justify-end">
        <button onClick={() => onToggle(coupon.id, !coupon.active)} style={{ color: coupon.active ? COLORS.warning : COLORS.healthy }} className="text-[11px] underline underline-offset-2">
          {coupon.active ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    </div>
  );
}

export default function ConfiguracoesView({ resellerId }) {
  // --- Conta ---
  const [account, setAccount] = useState({ name: '', whatsapp: '', email: '' });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState({});

  // --- Loja ---
  const [store, setStore] = useState({ storeName: '', slogan: '', storeUrl: '' });
  const [savingStore, setSavingStore] = useState(false);
  const [storeMsg, setStoreMsg] = useState({});

  // --- API do fornecedor ---
  const [api, setApi] = useState({ apiKey: '••••••••', apiUrl: '' });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiError, setApiError] = useState(null);
  const [savingApi, setSavingApi] = useState(false);

  // --- Cupons ---
  const [coupons, setCoupons] = useState([]);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponsError, setCouponsError] = useState(null);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  // --- Senha ---
  const [password, setPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({});

  useEffect(() => {
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCouponsError('Não foi possível carregar os cupons.'))
      .finally(() => setLoadingCoupons(false));

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.account) setAccount(data.account);
        if (data.store) setStore(data.store);
        if (data.api) setApi(data.api);
      })
      .catch(() => {
        setAccountMsg({ error: 'Não foi possível carregar seus dados salvos.' });
      });
  }, []);

  async function saveAccount() {
    setSavingAccount(true);
    setAccountMsg({});
    try {
      const res = await fetch('/api/save-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountMsg({ error: data.error || 'Não foi possível salvar.' });
      } else {
        setAccountMsg({ success: data.warning || 'Dados salvos.' });
      }
    } catch {
      setAccountMsg({ error: 'Erro de conexão. Tente novamente.' });
    } finally {
      setSavingAccount(false);
    }
  }

  async function saveStore() {
    setSavingStore(true);
    setStoreMsg({});
    try {
      const res = await fetch('/api/save-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: store.storeName, slogan: store.slogan }),
      });
      const data = await res.json();
      setStoreMsg(res.ok ? { success: 'Loja atualizada.' } : { error: data.error || 'Não foi possível salvar.' });
    } catch {
      setStoreMsg({ error: 'Erro de conexão. Tente novamente.' });
    } finally {
      setSavingStore(false);
    }
  }

  async function saveApiAccount() {
    if (!apiKeyInput.trim() || !api.apiUrl.trim()) return;
    setSavingApi(true);
    setApiError(null);
    try {
      const res = await fetch('/api/save-api-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput, apiUrl: api.apiUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || 'Não foi possível salvar.');
        return;
      }
      setApi((prev) => ({ ...prev, apiKey: data.apiKeyMasked }));
      setApiKeyInput('');
    } catch {
      setApiError('Erro de conexão. Tente novamente.');
    } finally {
      setSavingApi(false);
    }
  }

  async function addCoupon(c) {
    setSavingCoupon(true);
    setCouponsError(null);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponsError(data.error || 'Não foi possível criar o cupom.');
        return;
      }
      setCoupons((prev) => [data.coupon, ...prev]);
    } catch {
      setCouponsError('Erro de conexão. Tente novamente.');
    } finally {
      setSavingCoupon(false);
    }
  }

  async function toggleCoupon(id, active) {
    // Otimista: já reflete na tela, mas desfaz se a API falhar
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: !active } : c)));
      setCouponsError('Não foi possível atualizar o cupom.');
    }
  }

  async function savePassword() {
    if (password.length < 8) {
      setPasswordMsg({ error: 'A senha precisa ter pelo menos 8 caracteres.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg({});
    try {
      const res = await fetch('/api/save-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ error: data.error || 'Não foi possível atualizar a senha.' });
      } else {
        setPasswordMsg({ success: 'Senha atualizada.' });
        setPassword('');
      }
    } catch {
      setPasswordMsg({ error: 'Erro de conexão. Tente novamente.' });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <Section title="Dados da conta">
        <FeedbackBanner error={accountMsg.error} success={accountMsg.success} />
        <Field label="Nome" value={account.name} onChange={(v) => setAccount({ ...account, name: v })} />
        <Field label="WhatsApp" value={account.whatsapp} onChange={(v) => setAccount({ ...account, whatsapp: v })} />
        <Field label="E-mail" value={account.email} onChange={(v) => setAccount({ ...account, email: v })} />
        <SaveButton onClick={saveAccount} saving={savingAccount} />
      </Section>

      <Section title="Loja">
        <FeedbackBanner error={storeMsg.error} success={storeMsg.success} />
        <Field label="Nome da loja" value={store.storeName} onChange={(v) => setStore({ ...store, storeName: v })} />
        <Field label="Slogan / descrição" value={store.slogan} onChange={(v) => setStore({ ...store, slogan: v })} />
        <div className="mb-3">
          <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">Link da loja</label>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textSecondary }} className="text-sm">{store.storeUrl} <span className="text-[11px]">(gerado no cadastro, não editável)</span></div>
        </div>
        <SaveButton onClick={saveStore} saving={savingStore} />
      </Section>

      <Section title="Integração com a API do fornecedor">
        {apiError && <FeedbackBanner error={apiError} />}
        <div className="mb-3">
          <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
            API Key atual
          </label>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: COLORS.textSecondary }} className="text-sm">
            {api.apiKey}
          </div>
        </div>
        <Field label="Nova API Key" value={apiKeyInput} onChange={setApiKeyInput} masked hint="Cole a chave gerada no painel do seu fornecedor" />
        <Field label="URL base do painel" value={api.apiUrl} onChange={(v) => setApi({ ...api, apiUrl: v })} hint="Ex: https://api.seufornecedor.com/v2" />
        <SaveButton onClick={saveApiAccount} saving={savingApi} />
      </Section>

      <Section title="Cupons de desconto">
        {couponsError && <FeedbackBanner error={couponsError} />}
        <CouponForm onAdd={addCoupon} saving={savingCoupon} />
        <div style={{ borderColor: COLORS.border }} className="rounded-lg border">
          <div style={{ borderColor: COLORS.border, color: COLORS.textSecondary }} className="grid grid-cols-12 gap-2 px-3 py-2 border-b text-[11px] uppercase tracking-wide">
            <div className="col-span-3">Código</div>
            <div className="col-span-3">Desconto</div>
            <div className="col-span-4">Uso</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <div className="px-3">
            {loadingCoupons && (
              <div style={{ color: COLORS.textSecondary }} className="text-sm text-center py-6">Carregando…</div>
            )}
            {!loadingCoupons && coupons.map((c) => <CouponRow key={c.id} coupon={c} onToggle={toggleCoupon} />)}
            {!loadingCoupons && coupons.length === 0 && (
              <div style={{ color: COLORS.textSecondary }} className="text-sm text-center py-6">Nenhum cupom criado ainda.</div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Senha">
        <FeedbackBanner error={passwordMsg.error} success={passwordMsg.success} />
        <Field label="Nova senha" value={password} onChange={setPassword} masked />
        <SaveButton onClick={savePassword} saving={savingPassword} />
      </Section>
    </div>
  );
}
