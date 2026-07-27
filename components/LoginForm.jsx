'use client';

/**
 * Tela de login do revendedor.
 * Colar em app/login/page.jsx (já deixei esse arquivo pronto também).
 * Mesma paleta/identidade visual das outras telas do painel.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = {
  bg: '#0A0F1C',
  surface: '#121A2B',
  border: '#232D45',
  textPrimary: '#E7ECF6',
  textSecondary: '#7C8BA8',
  revenue: '#2DD4C8',
  critical: '#F0576B',
};

export default function LoginForm() {
  const router = useRouter();
  const [storeSlug, setStoreSlug] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível entrar.');
        return;
      }

      router.push('/painel');
      router.refresh();
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh' }} className="flex items-center justify-center p-6">
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <form
        onSubmit={handleSubmit}
        style={{ background: COLORS.surface, borderColor: COLORS.border, fontFamily: 'Inter, sans-serif' }}
        className="w-full max-w-sm rounded-xl border p-8"
      >
        <div
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: COLORS.textPrimary }}
          className="text-xl font-bold mb-6"
        >
          Entrar no painel
        </div>

        {error && (
          <div
            style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
            className="rounded-lg border px-4 py-3 text-sm mb-5"
          >
            {error}
          </div>
        )}

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          Usuário (slug da loja)
        </label>
        <input
          value={storeSlug}
          onChange={(e) => setStoreSlug(e.target.value)}
          style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full rounded-md border px-3 py-2 text-sm mb-4 outline-none"
          autoComplete="username"
        />

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full rounded-md border px-3 py-2 text-sm mb-6 outline-none"
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          style={{ background: COLORS.revenue, color: COLORS.bg, opacity: loading ? 0.6 : 1 }}
          className="w-full text-sm px-4 py-2.5 rounded-md font-medium hover:brightness-110 transition disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
