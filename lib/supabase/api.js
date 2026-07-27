// lib/supabase/api.js
// Helper de sessão para as API routes no estilo `pages/api/*.js`
// (handler(req, res)). É ESTE arquivo que resolve o TODO de segurança
// que estava em connect-gateway.js e save-api-account.js.
//
// Uso dentro de qualquer API route protegida:
//
//   import { requireReseller } from '../../lib/supabase/api';
//
//   export default async function handler(req, res) {
//     const session = await requireReseller(req, res);
//     if (!session) return; // requireReseller já respondeu 401
//     const { resellerId } = session;
//     // ... use resellerId, NUNCA req.body.resellerId
//   }

import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { supabaseAdmin } from '../supabaseAdmin';

function getSupabaseForRequest(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(req.headers.cookie ?? '');
        },
        setAll(cookiesToSet) {
          res.setHeader(
            'Set-Cookie',
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );
}

// Valida a sessão (cookie httpOnly do Supabase Auth) e resolve o
// reseller_id correspondente. Se não houver sessão válida, já responde
// 401 e devolve `null` (o handler deve simplesmente dar `return`).
export async function requireReseller(req, res) {
  const supabase = getSupabaseForRequest(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    return null;
  }

  // A checagem "esse reseller pertence a esse usuário" usa a service
  // role (supabaseAdmin) só para essa leitura pontual — resellerId
  // nunca vem do body, vem sempre do user_id da sessão.
  const { data: reseller, error: resellerError } = await supabaseAdmin
    .from('resellers')
    .select('id, name, status')
    .eq('user_id', user.id)
    .single();

  if (resellerError || !reseller) {
    res.status(403).json({ error: 'Nenhum revendedor associado a esta conta.' });
    return null;
  }

  return { user, resellerId: reseller.id, reseller };
}
