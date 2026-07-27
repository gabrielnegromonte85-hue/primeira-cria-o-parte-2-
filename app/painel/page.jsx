// app/painel/page.jsx
// Server Component: resolve a sessão real (cookie httpOnly) e só então
// renderiza o painel do revendedor, já com o resellerId correto.
// O middleware.js já bloqueia /painel para quem não está logado, mas
// mantemos essa checagem aqui também (defesa em profundidade).

import { redirect } from 'next/navigation';
import { getSessionReseller } from '../../lib/supabase/server';
import RevendedorPainel from '../../components/RevendedorPainel';

export default async function PainelPage() {
  const session = await getSessionReseller();

  if (!session) {
    redirect('/login');
  }

  return (
    <RevendedorPainel
      resellerId={session.resellerId}
      resellerName={session.reseller.name}
      storeSlug={session.reseller.store_slug}
    />
  );
}
