// api/create-order-mercadopago.js
// Substitui o create-order.js antigo (que usava uma chave Stripe fixa).
// Agora o pedido é criado usando o Mercado Pago do PRÓPRIO revendedor —
// o dinheiro cai direto na conta dele, o master nunca vê esse valor passar.
//
// Front-end da loja (/loja/[slug]) chama este endpoint com:
//   { storeSlug, serviceId, link, quantity, buyerEmail }
//
// IMPORTANTE: o preço NUNCA vem do front-end. Buscamos o sale_price real
// salvo em `reseller_services` — assim ninguém consegue manipular o preço
// no navegador e pagar menos do que deveria.
//
// ATUALIZAÇÃO: agora também salvamos `service_id` no pedido (não só o
// nome) — é isso que `deliverOrder.js` usa depois para saber qual serviço
// pedir na API do fornecedor. Sem isso, o webhook não teria como entregar.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { decrypt } from '../../lib/crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { storeSlug, serviceId, link, quantity, buyerEmail } = req.body;

    if (!storeSlug || !serviceId || !link || !quantity) {
      return res.status(400).json({ error: 'Dados do pedido incompletos' });
    }

    // 1) Encontrar o revendedor pelo slug da loja
    const { data: reseller, error: resellerErr } = await supabaseAdmin
      .from('resellers')
      .select('id, name, status')
      .eq('store_slug', storeSlug)
      .single();

    if (resellerErr || !reseller) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    if (reseller.status === 'blocked') {
      return res.status(403).json({ error: 'Esta loja está temporariamente indisponível' });
    }

    // 2) Buscar o serviço ativo e o preço REAL definido pelo revendedor
    const { data: service, error: serviceErr } = await supabaseAdmin
      .from('reseller_services')
      .select('service_id, name, sale_price, active')
      .eq('reseller_id', reseller.id)
      .eq('service_id', serviceId)
      .eq('active', true)
      .single();

    if (serviceErr || !service) {
      return res.status(404).json({ error: 'Serviço indisponível' });
    }

    // 3) Buscar o gateway Mercado Pago ativo desse revendedor
    const { data: gateway, error: gatewayErr } = await supabaseAdmin
      .from('reseller_payment_gateways')
      .select('access_token_enc')
      .eq('reseller_id', reseller.id)
      .eq('provider', 'mercado_pago')
      .eq('active', true)
      .single();

    if (gatewayErr || !gateway) {
      return res.status(503).json({
        error: 'Esta loja ainda não configurou uma forma de pagamento',
      });
    }

    const accessToken = decrypt(gateway.access_token_enc);
    const totalAmount = Number(service.sale_price) * Number(quantity) / 1000;
    // (mesma lógica de preço por milhar usada no create-order.js original —
    // ajuste aqui se o seu modelo de preço for por unidade, não por milhar)

    const externalReference = `${reseller.id}_${Date.now()}`;

    // 4) Criar o registro do pedido como "pending" ANTES de mandar pro Mercado Pago
    const { error: orderErr } = await supabaseAdmin.from('orders').insert({
      reseller_id: reseller.id,
      type: 'auto',
      service: service.name,
      service_id: service.service_id,
      amount: totalAmount,
      status: 'pending',
      external_reference: externalReference,
      link,
      quantity,
    });

    if (orderErr) {
      console.error('Erro ao criar pedido:', orderErr.message);
      return res.status(500).json({ error: 'Não foi possível registrar o pedido' });
    }

    // 5) Criar a preferência de pagamento no Mercado Pago, usando o token
    // do REVENDEDOR (não uma chave fixa do master)
    const notificationUrl = `${process.env.SITE_URL}/api/webhook-mercadopago?reseller_id=${reseller.id}`;

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `${service.name} — ${Number(quantity).toLocaleString('pt-BR')} unidades`,
            quantity: 1,
            unit_price: totalAmount,
            currency_id: 'BRL',
          },
        ],
        payer: buyerEmail ? { email: buyerEmail } : undefined,
        external_reference: externalReference,
        notification_url: notificationUrl,
        back_urls: {
          success: `${process.env.SITE_URL}/loja/${storeSlug}/sucesso`,
          failure: `${process.env.SITE_URL}/loja/${storeSlug}`,
        },
        auto_return: 'approved',
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro do Mercado Pago:', mpData);
      return res.status(502).json({ error: 'Não foi possível iniciar o pagamento' });
    }

    return res.status(200).json({ url: mpData.init_point });
  } catch (err) {
    console.error('Erro ao criar pedido:', err.message);
    return res.status(500).json({ error: 'Erro interno ao criar pedido' });
  }
}
