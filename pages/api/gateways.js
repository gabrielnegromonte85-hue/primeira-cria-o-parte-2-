// pages/api/gateways.js
// GET usado pelo PagamentosView.jsx ao abrir a tela, pra saber o
// estado real das conexões (Mercado Pago / Expay) — sem isso, a tela
// sempre abria "do zero" mesmo com um gateway já conectado.

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
    const { data: gateways, error } = await supabaseAdmin
      .from('reseller_payment_gateways')
      .select('provider, access_token_enc, active, connected_at')
      .eq('reseller_id', session.resellerId);

    if (error) {
      return res.status(500).json({ error: 'Não foi possível carregar as conexões' });
    }

    const connections = {};
    for (const g of gateways) {
      connections[g.provider] = {
        connected: true,
        active: g.active,
        tokenMasked: maskToken(decrypt(g.access_token_enc)),
        connectedAt: g.connected_at,
      };
    }

    return res.status(200).json({ connections });
  } catch (err) {
    console.error('Erro em /api/gateways:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
