// pages/api/settings.js
// GET usado pelo ConfiguracoesView.jsx ao abrir a tela, pra carregar
// os dados já salvos (conta, loja, API) em uma única chamada — sem
// isso, os campos ficariam em branco toda vez que a página recarrega.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { requireReseller } from '../../lib/supabase/api';
import { decrypt, maskToken } from '../../lib/crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return;

  try {
    const { data: reseller, error: resellerError } = await supabaseAdmin
      .from('resellers')
      .select('name, whatsapp, store_name, slogan, store_slug')
      .eq('id', session.resellerId)
      .single();

    if (resellerError) {
      return res.status(500).json({ error: 'Não foi possível carregar os dados' });
    }

    const { data: apiAccount } = await supabaseAdmin
      .from('api_accounts')
      .select('api_key_enc, api_url')
      .eq('reseller_id', session.resellerId)
      .maybeSingle();

    return res.status(200).json({
      account: {
        name: reseller.name || '',
        whatsapp: reseller.whatsapp || '',
        email: session.user.email || '',
      },
      store: {
        storeName: reseller.store_name || reseller.name || '',
        slogan: reseller.slogan || '',
        storeUrl: reseller.store_slug ? `${process.env.SITE_URL || ''}/loja/${reseller.store_slug}` : '',
      },
      api: {
        // Descriptografa só neste servidor para computar a máscara —
        // o valor em texto puro nunca sai desta função, muito menos
        // vai pro navegador.
        apiKey: apiAccount ? maskToken(decrypt(apiAccount.api_key_enc)) : 'Nenhuma cadastrada',
        apiUrl: apiAccount?.api_url || '',
      },
    });
  } catch (err) {
    console.error('Erro em /api/settings:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
