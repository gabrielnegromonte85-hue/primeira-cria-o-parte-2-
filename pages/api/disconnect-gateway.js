// pages/api/disconnect-gateway.js
// Chamada pelo botão "Desconectar" do PagamentosView.jsx. Antes disso
// o botão só mudava o estado local (setState) — não existia rota real,
// então o token continuava salvo (e ativo) no banco mesmo depois do
// clique.
//
// Marca active = false em vez de apagar a linha: preserva o histórico
// de quando foi conectado, e o token continua criptografado no banco
// mesmo desativado (mais fácil reativar depois, se for o caso).

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { requireReseller } from '../../lib/supabase/api';

const VALID_PROVIDERS = ['mercado_pago', 'expay'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return;

  try {
    const { provider } = req.body;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'Provedor inválido' });
    }

    const { error } = await supabaseAdmin
      .from('reseller_payment_gateways')
      .update({ active: false })
      .eq('reseller_id', session.resellerId)
      .eq('provider', provider);

    if (error) {
      console.error('Erro ao desconectar gateway:', error.message);
      return res.status(500).json({ error: 'Não foi possível desconectar' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro em disconnect-gateway:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
