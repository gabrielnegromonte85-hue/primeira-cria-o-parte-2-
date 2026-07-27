// pages/api/coupons.js
// Persistência real dos cupons do ConfiguracoesView.jsx (antes era só
// `MOCK_COUPONS` em useState). Uma rota só, com 3 métodos:
//   GET    -> lista os cupons do revendedor logado
//   POST   -> cria um cupom novo
//   PATCH  -> ativa/desativa um cupom existente ({ id, active })

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { requireReseller } from '../../lib/supabase/api';

export default async function handler(req, res) {
  const session = await requireReseller(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('id, code, discount_type, discount_value, max_uses, used_count, active')
      .eq('reseller_id', session.resellerId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Não foi possível carregar os cupons' });
    return res.status(200).json({ coupons: data });
  }

  if (req.method === 'POST') {
    const { code, type, value, maxUses } = req.body;

    if (!code || !type || !value) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    if (!['percent', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de desconto inválido' });
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        reseller_id: session.resellerId,
        code: code.toUpperCase(),
        discount_type: type,
        discount_value: value,
        max_uses: maxUses || null,
      })
      .select('id, code, discount_type, discount_value, max_uses, used_count, active')
      .single();

    if (error) {
      const message = error.code === '23505' ? 'Já existe um cupom com esse código.' : 'Não foi possível criar o cupom.';
      return res.status(400).json({ error: message });
    }

    return res.status(200).json({ coupon: data });
  }

  if (req.method === 'PATCH') {
    const { id, active } = req.body;
    if (!id || typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // .eq('reseller_id', ...) garante que ninguém consegue ativar/
    // desativar cupom de outro revendedor só adivinhando o id.
    const { error } = await supabaseAdmin
      .from('coupons')
      .update({ active })
      .eq('id', id)
      .eq('reseller_id', session.resellerId);

    if (error) return res.status(500).json({ error: 'Não foi possível atualizar o cupom' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
