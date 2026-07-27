// pages/api/connect-gateway.js
// Chamada pelo PagamentosView.jsx quando o revendedor conecta/troca o
// token do Mercado Pago ou da Expay. Criptografa antes de salvar —
// nunca grava o token em texto puro.
//
// SEGURANÇA: o resellerId agora vem SEMPRE da sessão validada em
// requireReseller(), nunca do corpo da requisição. O TODO antigo foi
// resolvido — ver lib/supabase/api.js.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { encrypt, maskToken } from '../../lib/crypto';
import { requireReseller } from '../../lib/supabase/api';

const VALID_PROVIDERS = ['mercado_pago', 'expay'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return; // requireReseller já respondeu 401/403

  try {
    const { provider, accessToken } = req.body;

    if (!provider || !accessToken) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'Provedor inválido' });
    }

    const accessTokenEnc = encrypt(accessToken);

    const { error } = await supabaseAdmin
      .from('reseller_payment_gateways')
      .upsert(
        {
          reseller_id: session.resellerId,
          provider,
          access_token_enc: accessTokenEnc,
          active: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'reseller_id,provider' }
      );

    if (error) {
      console.error('Erro ao salvar gateway:', error.message);
      return res.status(500).json({ error: 'Não foi possível salvar a conexão' });
    }

    return res.status(200).json({ tokenMasked: maskToken(accessToken) });
  } catch (err) {
    console.error('Erro em connect-gateway:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
