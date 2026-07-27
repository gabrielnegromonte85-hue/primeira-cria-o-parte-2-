'use client';

/**
 * app/cadastro/page.jsx
 * -------------------------------------------------------
 * Cadastro de um novo revendedor. Chama /api/auth/cadastro, que cria
 * o usuário no Supabase Auth E a linha em `resellers` na mesma
 * chamada (ver pages/api/auth/cadastro.js). Depois faz login
 * automático.
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

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          whatsapp,
          email,
          password,
          storeSlug: slugify(name),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível criar a conta.');
        setLoading(false);
        return;
      }

      // Cadastro criou o usuário no servidor; agora fazemos login no
      // navegador para o cookie de sessão ser gravado corretamente.
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError('Conta criada! Faça login para continuar.');
        setLoading(false);
        router.push('/login');
        return;
      }

      router.push('/painel');
      router.refresh();
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
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
          Criar conta
        </h1>
        <p style={{ color: COLORS.textSecondary }} className="text-sm mb-6">
          Comece a vender em minutos
        </p>

        {error && (
          <div
            style={{ background: 'rgba(240,87,107,0.1)', borderColor: COLORS.critical, color: COLORS.critical }}
            className="rounded-lg border px-4 py-3 text-sm mb-4"
          >
            {error}
          </div>
        )}

        {[
          { label: 'Nome do negócio', value: name, set: setName, type: 'text' },
          { label: 'WhatsApp', value: whatsapp, set: setWhatsapp, type: 'text' },
          { label: 'E-mail', value: email, set: setEmail, type: 'email' },
          { label: 'Senha (mín. 8 caracteres)', value: password, set: setPassword, type: 'password' },
        ].map((f) => (
          <div key={f.label} className="mb-4">
            <label style={{ color: COLORS.textSecondary }} className="text-[11px] uppercase tracking-wide block mb-1.5">
              {f.label}
            </label>
            <input
              type={f.type}
              required
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              style={{ background: COLORS.surfaceHover, borderColor: COLORS.border, color: COLORS.textPrimary }}
              className="w-full text-sm rounded-md border px-3 py-2"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{ background: COLORS.revenue, color: COLORS.bg, opacity: loading ? 0.6 : 1 }}
          className="w-full text-sm px-4 py-2.5 rounded-md font-medium hover:brightness-110 transition disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Criando…' : 'Criar conta'}
        </button>

        <div style={{ color: COLORS.textSecondary }} className="text-xs text-center mt-4">
          Já tem conta?{' '}
          <a href="/login" style={{ color: COLORS.revenue }} className="underline underline-offset-2">
            Entrar
          </a>
        </div>
      </form>
    </div>
  );
}
