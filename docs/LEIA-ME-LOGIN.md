# Login do revendedor + correção de segurança

## O que foi feito

- Sistema de login de verdade para o revendedor (usuário = slug da loja,
  senha = a que estiver em `password_hash` na tabela `resellers`)
- Sessão guardada num cookie `httpOnly` (o navegador não consegue ler/alterar
  via JavaScript), assinada com JWT — válida por 7 dias
- `connect-gateway.js` e `save-api-account.js` corrigidos: agora pegam o
  `resellerId` da sessão, não confiam mais no que vem no body da requisição
- `middleware.js` protegendo `/painel/*` — sem login, redireciona pro `/login`
- Botão "Sair" no painel do revendedor

## Passo a passo para instalar

1. Instale as duas dependências novas:
   ```
   npm install jose bcryptjs
   ```

2. Gere uma `SESSION_SECRET` e configure como variável de ambiente
   (Vercel → Settings → Environment Variables):
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Como ainda não existe tela de cadastro de revendedor, gere a senha do
   primeiro revendedor com o script incluso e cole o hash na coluna
   `password_hash` dele no Supabase:
   ```
   node scripts/hash-password.js "a-senha-que-você-quiser"
   ```

4. Cole os arquivos deste pacote nas pastas correspondentes do seu projeto
   (mesma estrutura de pastas: `lib/`, `pages/api/`, `components/`, `app/`,
   `middleware.js` na raiz).

5. Ajuste o `matcher` em `middleware.js` se o painel do revendedor não
   estiver em `/painel` — hoje ele protege `/painel/:path*`.

6. Onde quer que o `RevendedorPainel.jsx` seja renderizado (ex:
   `app/painel/page.jsx`), troque para buscar o revendedor real usando a
   sessão, por exemplo:
   ```jsx
   import { requireResellerServer } from '../../lib/requireResellerServer';
   import { supabaseAdmin } from '../../lib/supabaseAdmin';
   import RevendedorPainel from '../../components/RevendedorPainel';

   export default async function PainelPage() {
     const resellerId = await requireResellerServer();
     const { data: reseller } = await supabaseAdmin
       .from('resellers')
       .select('*')
       .eq('id', resellerId)
       .single();

     return <RevendedorPainel reseller={reseller} />;
   }
   ```
   (o `RevendedorPainel.jsx` ainda usa `MOCK_DATA` internamente — trocar
   isso pelos dados reais do revendedor logado é o próximo passo natural,
   já que hoje ele não recebe nenhuma prop.)

## O que ficou de fora (de propósito, para não misturar escopos)

- **Cadastro de revendedor pela interface** — hoje só dá pra criar um
  gerando o hash manualmente (passo 3). Se quiser, dá pra construir uma
  tela de "criar revendedor" no Painel Master que já gera o hash no
  servidor.
- **Login do Painel Master (você)** — este login é só para os revendedores.
  O Painel Master ainda não tem autenticação própria.
- **"Esqueci minha senha"** — não existe ainda.
