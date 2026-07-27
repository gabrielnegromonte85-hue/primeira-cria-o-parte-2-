// api/confirm-manual-order.js
// Chamada pelo PedidosView.jsx quando o revendedor confirma que já
// entregou manualmente (via WhatsApp) um pedido manual. resellerId vem
// da sessão — o filtro por reseller_id + type + status impede que alguém
// confirme (ou "roube" a confirmação de) um pedido que não é dele.

import { supabaseAdmin } from '../lib/supabaseAdmin';
import { requireReseller } from '../lib/requireReseller';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const resellerId = await requireReseller(req, res);
  if (!resellerId) return;

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', orderId)
      .eq('reseller_id', resellerId)
      .eq('type', 'manual')
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Pedido não encontrado ou já processado' });
    }

    return res.status(200).json({ ok: true, order: data });
  } catch (err) {
    console.error('Erro em confirm-manual-order:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
