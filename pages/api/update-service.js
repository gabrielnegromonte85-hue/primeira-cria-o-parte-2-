// api/update-service.js
// Chamada pelo ServicosView.jsx quando o revendedor ativa/desativa um
// serviço ou muda o preço de venda. resellerId vem da sessão (mesmo
// padrão do connect-gateway.js) — nunca do body.
//
// Atualiza SÓ a linha que pertence a esse revendedor: mesmo que alguém
// tente mandar o service_id de outro revendedor, o `.eq('reseller_id', ...)`
// impede de mexer no serviço de outra loja.

import { supabaseAdmin } from '../lib/supabaseAdmin';
import { requireReseller } from '../lib/requireReseller';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const resellerId = await requireReseller(req, res);
  if (!resellerId) return;

  try {
    const { serviceId, active, salePrice } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: 'serviceId é obrigatório' });
    }

    const updates = {};

    if (typeof active === 'boolean') {
      updates.active = active;
    }

    if (salePrice !== undefined) {
      const price = Number(salePrice);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: 'Preço de venda inválido' });
      }
      updates.sale_price = price;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada para atualizar' });
    }

    const { data, error } = await supabaseAdmin
      .from('reseller_services')
      .update(updates)
      .eq('reseller_id', resellerId)
      .eq('service_id', serviceId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    return res.status(200).json({ ok: true, service: data });
  } catch (err) {
    console.error('Erro em update-service:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

// NOTA: este endpoint só ATUALIZA serviços que já existem em
// `reseller_services`. Ele não cria a linha do zero — isso pressupõe que
// exista um passo anterior que importa o catálogo do fornecedor (com
// service_id, network, name, cost) pra dentro dessa tabela quando o
// revendedor conecta a API dele. Esse passo de importação ainda NÃO
// existe em nenhum arquivo que você mandou — hoje a única forma de um
// serviço aparecer na tela é inserindo a linha manualmente no Supabase.
