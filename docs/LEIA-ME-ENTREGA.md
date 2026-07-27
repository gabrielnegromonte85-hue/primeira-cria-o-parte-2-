# Correção: entrega do pedido depois do pagamento

## O problema

`webhook-mercadopago.js` chamava `deliverOrder(...)`, mas esse arquivo
nunca existia em nenhum dos zips que você mandou. Além disso, o pedido
salvo no banco guardava só o **nome** do serviço (para exibir na tela),
nunca o `service_id` que a API do fornecedor exige para saber o que
entregar. Ou seja: mesmo criando o `deliverOrder.js`, ele não teria como
funcionar sem essa informação.

## O que este pacote resolve

- `lib/deliverOrder.js` — busca a API Key do fornecedor **daquele
  revendedor específico** (nunca uma chave fixa), descriptografa, chama a
  API dele (padrão `action=add`, igual o `webhook.js` antigo do Stripe
  fazia), e marca o pedido como `completed` (com o `supplier_order_id`) ou
  `failed` — nunca deixa preso em `pending`
- `create-order-mercadopago.js` atualizado — agora salva `service_id`
  junto com o pedido
- `webhook-mercadopago.js` atualizado — busca esse `service_id` e passa
  pro `deliverOrder`
- `schema-deliver-order.sql` — adiciona a coluna que faltava

## Passo a passo

1. Rode `schema-deliver-order.sql` no Supabase (é só um `alter table`,
   incremental, não precisa rodar nada antes de novo)
2. Substitua `create-order-mercadopago.js` e `webhook-mercadopago.js`
   pelas versões deste pacote
3. Adicione `lib/deliverOrder.js`

## Ponto de atenção que ainda fica de fora

Se a chamada para a API do fornecedor falhar (fornecedor fora do ar, saldo
insuficiente, etc.), o pedido fica marcado como `failed` — mas o cliente
já pagou. Hoje isso só fica registrado no log e no status do pedido; não
tem fila de reprocessamento automático nem aviso por e-mail/WhatsApp para
você ou pro revendedor. Isso é o mesmo ponto de atenção que já existia no
`webhook.js` do Stripe original — vale resolver antes de ter volume real
de pedidos.

Também não há nenhum controle do `balance`/saldo do fornecedor (a coluna
existe em `api_accounts` desde o schema original, mas nada a atualiza) —
é por isso que o "aviso de saldo baixo" no painel do revendedor ainda usa
dado mocado.
