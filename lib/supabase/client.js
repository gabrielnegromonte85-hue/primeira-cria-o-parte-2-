// lib/supabase/client.js
// Cliente Supabase para uso em Client Components ('use client').
// Usa a ANON KEY — é seguro expor no navegador, porque agora as
// tabelas estão protegidas por RLS (ver sql/001_auth_rls.sql).

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
