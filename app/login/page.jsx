'use client';

/**
 * app/login/page.jsx
 * -------------------------------------------------------
 * Login do revendedor via Supabase Auth (e-mail + senha).
 * Depois do login, o middleware.js redireciona automaticamente
 * pra /painel.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const COLORS = {
  bg: '#0A0F1C',
  surface: '#121A2B',
  surfaceHover: '#1A2338',
  border: '#232D45',
  textPrimary: '#E7ECF6',
  textSecondary: '#7C8BA8',
  revenue: '#2DD4C8',
  critical: '#F0576B',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('E-mail ou senha incorretos.');
      return;
    }

    router.push('/painel');
    router.refresh();
  }

  return (
    <div
      style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}
      className="flex items-center justify-center p-6"
    >
      <form
        onSubmit={handleSubmit}
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
        className="max-w-sm w-full rounded-2xl border p-8"
      >
        <h1 style={{ color: COLORS.textPrimary }} className="text-xl font-semibold mb-1">
          Entrar
        </h1>
        <p style={{ color: COLORS.textSecondary }} className="text-sm mb-6">
          Acesse o painel do seu negócio
        </p>

        {error && (
          <div
            style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
            className="rounded-lg border px-4 py-3 text-sm mb-4"
          >
            {error}
          </div>
        )}

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full text-sm rounded-md border px-3 py-2 mb-4"
        />

        <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
          Senha
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
          className="w-full text-sm rounded-md border px-3 py-2 mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          style={{ background: COLORS.revenue, color: COLORS.bg, opacity: loading ? 0.6 : 1 }}
          className="w-full text-sm px-4 py-2.5 rounded-md font-medium hover:brightness-110 transition disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div style={{ color: COLORS.textSecondary }} className="text-xs text-center mt-4">
          Ainda não tem conta?{' '}
          <a href="/cadastro" style={{ color: COLORS.revenue }} className="underline underline-offset-2">
            Criar conta
          </a>
        </div>
      </form>
    </div>
  );
}
