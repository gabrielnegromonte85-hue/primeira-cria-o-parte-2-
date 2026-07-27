// lib/deliverOrder.js
// Chamada pelo webhook-mercadopago.js depois que o pagamento é confirmado.
// Busca a API Key do FORNECEDOR daquele revendedor específico (nunca uma
// chave fixa do master), descriptografa, e faz o pedido (padrão JAP:
// action=add) — o mesmo que o webhook.js antigo do Stripe fazia com
// `placeOrderOnPanel`, só que agora por revendedor em vez de uma única
// conta fixa.
//
// Atualiza o pedido em `orders` para 'completed' (com o supplier_order_id)
// ou 'failed' — nunca deixa o pedido preso em 'pending' depois de tentar.

import { supabaseAdmin } from './supabaseAdmin';
import { decrypt } from './crypto';

export async function deliverOrder({ resellerId, orderId, serviceId, link, quantity }) {
  try {
    const { data: apiAccount, error: apiAccountErr } = await supabaseAdmin
      .from('api_accounts')
      .select('api_key_enc, api_url')
      .eq('reseller_id', resellerId)
      .single();

    if (apiAccountErr || !apiAccount) {
      throw new Error('Este revendedor não tem uma API de fornecedor configurada');
    }

    const apiKey = decrypt(apiAccount.api_key_enc);

    const params = new URLSearchParams({
      key: apiKey,
      action: 'add',
      service: serviceId,
      link,
      quantity: String(quantity),
    });

    const response = await fetch(apiAccount.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || `Fornecedor respondeu com status ${response.status}`);
    }

    // A API do fornecedor normalmente devolve { order: <id> }
    await supabaseAdmin
      .from('orders')
      .update({ status: 'completed', supplier_order_id: String(data.order ?? '') })
      .eq('id', orderId);

    return data;
  } catch (err) {
    console.error(`Falha ao entregar pedido ${orderId} (reseller ${resellerId}):`, err.message);

    // O pagamento já foi aprovado neste ponto — marcar como 'failed' em vez
    // de deixar 'pending' para sinalizar que precisa de atenção manual.
    // TODO: quando houver volume, trocar por uma fila de retry automático
    // e/ou um alerta (e-mail/WhatsApp) para o revendedor e para o master,
    // já que o cliente pagou e ainda não recebeu.
    await supabaseAdmin
      .from('orders')
      .update({ status: 'failed' })
      .eq('id', orderId);

    throw err;
  }
}
