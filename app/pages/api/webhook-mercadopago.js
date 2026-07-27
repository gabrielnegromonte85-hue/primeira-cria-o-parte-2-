// api/webhook-mercadopago.js
// O Mercado Pago chama esta rota quando o status de um pagamento muda.
// Como cada revendedor usa a PRÓPRIA conta do Mercado Pago (não é uma
// conta marketplace/OAuth compartilhada), incluímos o reseller_id na
// própria URL do webhook (veja notification_url em create-order-mercadopago.js)
// para saber de quem é o token a usar na consulta.
//
// ATUALIZAÇÃO: agora busca também `service_id` do pedido — sem isso,
// `deliverOrder.js` não tinha como saber qual serviço pedir na API do
// fornecedor (o `service` guardado no pedido é só o nome, para exibição).

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { decrypt } from '../../lib/crypto';
import { deliverOrder } from '../../lib/deliverOrder';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const resellerId = req.query.reseller_id;
  const paymentId = req.body?.data?.id || req.query['data.id'];

  if (!resellerId || !paymentId) {
    // Responder 200 mesmo assim — o Mercado Pago re-tenta notificações que
    // recebem erro, e notificações malformadas não vão se corrigir sozinhas.
    console.warn('Webhook recebido sem reseller_id ou payment id.');
    return res.status(200).json({ received: true });
  }

  try {
    // 1) Buscar o token do Mercado Pago DESSE revendedor para poder
    // consultar o pagamento (só quem criou o pagamento pode consultá-lo)
    const { data: gateway, error: gatewayErr } = await supabaseAdmin
      .from('reseller_payment_gateways')
      .select('access_token_enc')
      .eq('reseller_id', resellerId)
      .eq('provider', 'mercado_pago')
      .single();

    if (gatewayErr || !gateway) {
      console.error('Gateway não encontrado para reseller:', resellerId);
      return res.status(200).json({ received: true });
    }

    const accessToken = decrypt(gateway.access_token_enc);

    // 2) Consultar o pagamento real na API do Mercado Pago
    // (nunca confiar apenas no payload do webhook — sempre confirmar direto na fonte)
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error('Erro ao consultar pagamento:', payment);
      return res.status(200).json({ received: true });
    }

    if (payment.status !== 'approved') {
      // Pagamento pendente, rejeitado, etc. — nada a fazer ainda.
      return res.status(200).json({ received: true });
    }

    // 3) Encontrar o pedido correspondente pelo external_reference
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, reseller_id, service_id, link, quantity, status')
      .eq('external_reference', payment.external_reference)
      .single();

    if (orderErr || !order) {
      console.error('Pedido não encontrado para external_reference:', payment.external_reference);
      return res.status(200).json({ received: true });
    }

    if (order.status !== 'pending') {
      // Já processado antes (o Mercado Pago pode reenviar a mesma notificação)
      return res.status(200).json({ received: true });
    }

    if (!order.service_id) {
      // Pedidos criados ANTES do schema-deliver-order.sql / da atualização
      // do create-order-mercadopago.js não têm service_id salvo — não dá
      // para entregar automaticamente. Fica marcado para atenção manual.
      console.error(`Pedido ${order.id} pago mas sem service_id — entrega manual necessária.`);
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return res.status(200).json({ received: true });
    }

    // 4) Entregar o serviço usando a API do fornecedor DESSE revendedor
    await deliverOrder({
      resellerId,
      orderId: order.id,
      serviceId: order.service_id,
      link: order.link,
      quantity: order.quantity,
    });

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Erro no webhook do Mercado Pago:', err.message);
    // Sempre 200 pro Mercado Pago não ficar re-tentando indefinidamente —
    // o erro real já foi registrado no log e o pedido marcado como 'failed'
    // dentro do deliverOrder.js.
    return res.status(200).json({ received: true });
  }
}
