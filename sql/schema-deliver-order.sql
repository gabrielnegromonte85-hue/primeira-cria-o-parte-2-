-- schema-deliver-order.sql
-- Incremento pequeno: `orders` guardava o NOME do serviço (para exibição),
-- mas não o `service_id` que a API do fornecedor exige para entregar o
-- pedido. Sem essa coluna, `deliverOrder.js` não tem como saber qual
-- serviço pedir na API do fornecedor.

alter table orders
  add column if not exists service_id text;
