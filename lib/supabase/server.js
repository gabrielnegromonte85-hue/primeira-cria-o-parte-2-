// lib/supabase/server.js
// Cliente Supabase para uso em Server Components / Server Actions do
// App Router (ex: app/painel/page.jsx). Lê a sessão a partir dos
// cookies da requisição — é isso que permite saber "quem está
// logado" sem confiar em nada vindo do body/query.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // set() chamado de um Server Component sem middleware —
            // pode ignorar se o middleware.js já cuida de refrescar a sessão.
          }
        },
      },
    }
  );
}

// Devolve { user, resellerId } da sessão atual, ou null se não
// estiver logado. Use isso em toda página/rota do painel do revendedor.
export async function getSessionReseller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: reseller } = await supabase
    .from('resellers')
    .select('id, name, store_slug, status')
    .eq('user_id', user.id)
    .single();

  if (!reseller) return null;

  return { user, reseller, resellerId: reseller.id };
}
