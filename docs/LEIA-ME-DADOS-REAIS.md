# Pedidos + Serviços + painel do revendedor com dados reais

## O que foi feito

- **`api/update-service.js`** — ativar/desativar serviço e mudar preço de
  venda salvam de verdade em `reseller_services` (protegido pela sessão)
- **`api/confirm-manual-order.js`** — confirmar pedido manual (WhatsApp)
  salva de verdade em `orders` (só confirma pedido que é do próprio
  revendedor, `type = manual` e `status = pending`)
- **`ServicosView.jsx`** e **`PedidosView.jsx`** reescritos: recebem os
  dados reais como prop em vez de `MOCK_SERVICES`/`MOCK_ORDERS`, e chamam
  as rotas acima
- **`RevendedorPainel.jsx`** reescrito — e aqui vale destacar um problema
  que eu não tinha notado antes: **as abas Pedidos, Serviços, Pagamentos e
  Configurações nunca estavam ligadas** — o componente só tinha
  `DashboardView` implementado; todo o resto caía num
  `<PlaceholderView title="... a construir na próxima etapa" />`, mesmo
  com `PedidosView.jsx`, `ServicosView.jsx`, `PagamentosView.jsx` e
  `ConfiguracoesView.jsx` já prontos e sem uso nenhum. Corrigido: as 5
  abas agora renderizam de verdade.
- **`app/painel/page.jsx`** (novo) — Server Component que exige sessão
  válida, busca revendedor + serviços + pedidos + saldo da API no
  Supabase, calcula faturamento do mês e contadores, e passa tudo pronto
  pro `RevendedorPainel`

## Passo a passo

1. Substitua `components/RevendedorPainel.jsx`, `components/ServicosView.jsx`
   e `components/PedidosView.jsx` pelas versões deste pacote
2. Copie `components/PagamentosView.jsx` e `components/ConfiguracoesView.jsx`
   também inclusos aqui — são as versões que já chamavam
   `connect-gateway`/`save-api-account` de verdade (do pacote de login),
   só que agora finalmente usadas
3. Adicione `pages/api/update-service.js` e `pages/api/confirm-manual-order.js`
4. Adicione `app/painel/page.jsx` (se você já tinha um, substitua)

## Coisas que ficam de fora (reais, vale saber)

- **Catálogo do fornecedor não é importado automaticamente.** `ServicosView`
  só ativa/reprecifica serviços que já existem em `reseller_services` — a
  função que puxa a lista de serviços da API do fornecedor e cria essas
  linhas (com `service_id`, `network`, `name`, `cost`) pra cada revendedor
  ainda não existe em nenhum lugar. Hoje, pra um serviço aparecer, alguém
  precisa inserir a linha manualmente no Supabase.
- **`balance` (saldo da API) nunca é atualizado automaticamente.** A coluna
  existe em `api_accounts` desde o schema original, mas nada escreve nela
  — então o card "Saldo da API" e o alerta de saldo baixo no dashboard só
  mudam se você editar direto no banco.
- Continuam pendentes: Painel Master (ainda mocado, precisa de login
  próprio antes), cupons de desconto, cadastro de revendedor pela
  interface, "esqueci minha senha".
