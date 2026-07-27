// pages/api/save-api-account.js
// Chamada pelo ConfiguracoesView.jsx na seção "Integração com a API do
// fornecedor". Criptografa a API Key antes de salvar em api_accounts.
//
// SEGURANÇA: resellerId agora vem da sessão (requireReseller), nunca
// do body.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { encrypt, maskToken } from '../../lib/crypto';
import { requireReseller } from '../../lib/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return;

  try {
    const { apiKey, apiUrl } = req.body;

    if (!apiKey || !apiUrl) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const apiKeyEnc = encrypt(apiKey);

    const { error } = await supabaseAdmin
      .from('api_accounts')
      .upsert(
        { reseller_id: session.resellerId, api_key_enc: apiKeyEnc, api_url: apiUrl },
        { onConflict: 'reseller_id' }
      );

    if (error) {
      console.error('Erro ao salvar conta de API:', error.message);
      return res.status(500).json({ error: 'Não foi possível salvar' });
    }

    return res.status(200).json({ apiKeyMasked: maskToken(apiKey) });
  } catch (err) {
    console.error('Erro em save-api-account:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
