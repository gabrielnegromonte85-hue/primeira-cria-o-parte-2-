# SocialBoost — checkout + entrega automática

## O que tem aqui
- `landing-smm-instagram.html` — a página de vendas
- `api/create-order.js` — cria a sessão de pagamento na Stripe
- `api/webhook.js` — quando a Stripe confirma o pagamento, chama a API do seu painel SMM
- `package.json` — dependência (Stripe)

## Passo a passo para colocar no ar (Vercel, grátis)

1. **Crie uma conta na Stripe** (stripe.com) e pegue duas chaves em *Developers → API keys*:
   - `STRIPE_SECRET_KEY` (começa com `sk_`)

2. **Crie um projeto na Vercel** (vercel.com), suba esta pasta inteira (pode ser via GitHub ou `vercel deploy` no terminal).

3. **Configure as variáveis de ambiente** no painel da Vercel (*Settings → Environment Variables*):

   | Nome | Valor |
   |---|---|
   | `STRIPE_SECRET_KEY` | sua chave secreta da Stripe |
   | `STRIPE_WEBHOOK_SECRET` | veja o passo 4 |
   | `SMM_PANEL_URL` | a URL da API do seu painel (ex: `https://seupainel.com/api/v2`) |
   | `SMM_PANEL_KEY` | a chave de API do seu painel |
   | `SITE_URL` | a URL do seu site depois de publicado (ex: `https://socialboost.vercel.app`) |

4. **Configure o webhook na Stripe:**
   - Vá em *Developers → Webhooks → Add endpoint*
   - URL: `https://SEU-SITE.vercel.app/api/webhook`
   - Evento a escutar: `checkout.session.completed`
   - Copie o "Signing secret" gerado e coloque em `STRIPE_WEBHOOK_SECRET`

5. **Confira os IDs de serviço do seu painel.** No código da página (`landing-smm-instagram.html`), cada serviço tem um `data-price` — troque pelos **IDs reais de serviço do seu painel** (não o preço), já que a API do painel identifica o serviço por ID, não por nome. O preço em reais você define separadamente, na hora de mostrar para o cliente.

6. Crie uma página simples `sucesso.html` para o cliente ver depois de pagar (pode pedir para eu montar essa também).

## Testando antes de ir ao ar
A Stripe tem modo de teste (chaves `sk_test_...`) e cartões de teste (ex: `4242 4242 4242 4242`) — assim dá pra testar o fluxo inteiro sem cobrar ninguém de verdade.

## Ponto de atenção
Se a chamada para o painel SMM falhar depois que o cliente já pagou (painel fora do ar, saldo insuficiente, etc.), o `webhook.js` só registra o erro no log por enquanto. Para produção, vale adicionar um aviso por e-mail ou uma fila de reprocessamento para não perder pedidos pagos e não entregues.
