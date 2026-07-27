# Entrega — Autenticação real + RLS + Configurações + Desconectar gateway

## O que foi feito

### 1. Autenticação real (login/cadastro + validação de sessão)
- `app/login/page.jsx` e `app/cadastro/page.jsx` — telas reais, usando **Supabase Auth**.
- `pages/api/auth/cadastro.js` — cria o usuário no Auth + a linha em `resellers`, ligados por `user_id`.
- `middleware.js` — protege `/painel/*`, redireciona quem não está logado pro `/login`, e redireciona quem já está logado pra longe de `/login`/`/cadastro`.
- `lib/supabase/{client,server,api}.js` — os 3 clientes Supabase que você vai precisar (navegador, Server Component, API route).
- **`connect-gateway.js` e `save-api-account.js` não confiam mais no `resellerId` do body** — o `resellerId` agora vem sempre de `requireReseller(req, res)`, que valida a sessão pelo cookie. Isso fecha o buraco descrito no `CICLO-COMPLETO.md`.

### 2. RLS no Supabase
- `sql/001_auth_rls.sql` — habilita RLS em `resellers`, `api_accounts`, `orders`, `reseller_payment_gateways`, `reseller_services` e `coupons` (nova tabela). Cada revendedor só enxerga as próprias linhas.
- Suas API routes usam a **service role key** (que ignora RLS por definição) — então RLS aqui é a segunda camada, não a única. Ela importa principalmente se algum dia você consultar o Supabase direto do navegador com a chave anon.

### 3. Persistência real em Configurações
- Conta, Loja, Cupons e Senha agora salvam de verdade (antes eram só `TODO`).
- Novos endpoints: `save-account.js`, `save-store.js`, `save-password.js`, `coupons.js` (GET/POST/PATCH), `settings.js` (GET, carrega os dados salvos ao abrir a tela).
- A senha nunca é salva na tabela `resellers` — quem guarda é o Supabase Auth (`auth.admin.updateUserById`).

### 4. Desconectar gateway
- `pages/api/disconnect-gateway.js` — o botão "Desconectar" do `PagamentosView.jsx` agora chama essa rota de verdade (antes só mudava o estado local, e o token continuava ativo no banco).
- `pages/api/gateways.js` — bônus necessário: sem isso a tela sempre abria "do zero", mesmo com gateway já conectado.

## O que NÃO mudou (fora do escopo desta entrega)
- `ServicosView.jsx` continua mock — é o próximo item da sua lista.
- Backend do Painel Master (admin) — se ele também precisar de login, é outra rodada (hoje só o revendedor tem auth real).
- O toggle "pausar sem desconectar" no `PagamentosView.jsx` ainda é só local — dá pra persistir com o mesmo padrão do `disconnect-gateway.js`, só trocando `active: false` por `active: true/false`.

## Passo a passo pra colocar no ar

1. **Instale as dependências novas:**
   ```
   npm install @supabase/ssr @supabase/supabase-js
   ```

2. **Rode a migração SQL** (`sql/001_auth_rls.sql`) no SQL Editor do Supabase — depois de já ter rodado `schema.sql` e `schema-atualizado.sql`.

3. **Variáveis de ambiente** (além das que você já tinha — `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `SITE_URL`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (a chave anon/pública, NÃO a service role)
   ```

4. **Copie os arquivos pro seu projeto**, respeitando os caminhos:
   - `middleware.js` → raiz do projeto
   - `app/login/`, `app/cadastro/`, `app/painel/` → dentro do seu `app/`
   - `lib/supabase/` → dentro do seu `lib/`
   - `pages/api/*.js` → dentro do seu `pages/api/` (crie a pasta se não existir — coexiste com o `app/` sem problema)
   - `components/*.jsx` → substitua os arquivos existentes

5. **Teste o fluxo:**
   - Criar conta em `/cadastro` → deve cair direto em `/painel`.
   - Deslogar (botão "Sair" na sidebar) → tentar acessar `/painel` direto pela URL → deve redirecionar pro `/login`.
   - Em Configurações: salvar conta, loja, criar um cupom, trocar a senha → recarregar a página → tudo deve continuar lá.
   - Em Pagamentos: conectar um token de teste → recarregar a página → continua conectado → clicar "Desconectar" → recarregar → continua desconectado (confirma no Supabase que `active = false`).

## Sobre a coluna `password_hash`
Deixei ela como opcional (`not null` removido) em vez de apagar, pra não quebrar nada que ainda dependa dela. Depois que confirmar que login/cadastro novos estão 100% funcionando, pode rodar:
```sql
alter table resellers drop column password_hash;
```
