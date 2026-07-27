# Ciclo completo — checkout multi-revendedor com Mercado Pago

## O caminho de ponta a ponta

1. **Revendedor conecta o Mercado Pago** em `PagamentosView.jsx` →
   chama `POST /api/connect-gateway` → token criptografado, salvo em
   `reseller_payment_gateways`.

2. **Revendedor cadastra a API do fornecedor** em `ConfiguracoesView.jsx` →
   chama `POST /api/save-api-account` → API Key criptografada, salva em
   `api_accounts`.

3. **Revendedor ativa serviços e define preços** — isso ainda usa
   `MOCK_SERVICES` no `ServicosView.jsx`; falta ligar ao/criar o backend
   real de `reseller_services` (mesma lógica de `connect-gateway.js`,
   só que salvando `service_id`, `sale_price`, `active`).

4. **Cliente final acessa `/loja/[slug]`** → `page.jsx` busca o revendedor,
   os serviços ativos e confirma que há gateway ativo → renderiza
   `StoreView.jsx`.

5. **Cliente escolhe serviço, quantidade, link** → `StoreView.jsx` chama
   `POST /api/create-order-mercadopago` → sistema busca o preço real, cria
   o pedido como `pending`, gera a preferência de pagamento usando o
   **token do revendedor**, devolve a URL de checkout do Mercado Pago.

6. **Cliente paga** → Mercado Pago confirma via
   `POST /api/webhook-mercadopago?reseller_id=...` → sistema confirma o
   pagamento direto na API do MP, marca o pedido, e entrega o serviço
   chamando a **API do fornecedor daquele revendedor específico**
   (`api_accounts`, descriptografada).

## Antes de ir pro ar

- [ ] Rodar `schema-atualizado.sql` no Supabase
- [ ] Gerar `ENCRYPTION_KEY` (comando no topo de `lib/crypto.js`) e configurar
      como variável de ambiente
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Configurar `SITE_URL` (usado no `notification_url` e `back_urls`)
- [ ] Trocar os `TODO` de autenticação em `connect-gateway.js` e
      `save-api-account.js` por validação de sessão real — hoje qualquer
      pessoa que soubesse o `resellerId` de outra loja poderia sobrescrever
      o gateway dela. Isso é o item de segurança mais importante antes de
      lançar.
- [ ] Criar o backend de `reseller_services` (mesmo padrão dos outros dois:
      criptografia não é necessária aqui, já que não é um segredo, só
      preço/ativo)
- [ ] Testar o fluxo inteiro com as credenciais de teste do Mercado Pago
      (usuários de teste, cartões de teste) antes de usar tokens reais

## O que NÃO mudou

- `create-order.js` / `webhook.js` (Stripe) continuam existindo — pode
  manter como está caso ainda use em algum outro fluxo, ou remover se o
  Mercado Pago for o único caminho de pagamento agora.
