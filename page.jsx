// app/loja/[slug]/page.jsx
// Página pública da loja de cada revendedor: /loja/turbosocial, /loja/viralzone, etc.
// Server component — busca os dados no servidor (nunca expõe API keys/tokens
// ao navegador) e passa só o necessário para o componente de cliente.

import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import StoreView from '../../../components/StoreView';
import { notFound } from 'next/navigation';

export default async function StorePage({ params }) {
  const { slug } = params;

  const { data: reseller } = await supabaseAdmin
    .from('resellers')
    .select('id, name, status')
    .eq('store_slug', slug)
    .single();

  if (!reseller || reseller.status === 'blocked') {
    notFound();
  }

  const { data: services } = await supabaseAdmin
    .from('reseller_services')
    .select('service_id, network, name, sale_price')
    .eq('reseller_id', reseller.id)
    .eq('active', true)
    .order('network', { ascending: true });

  const { data: gateway } = await supabaseAdmin
    .from('reseller_payment_gateways')
    .select('provider')
    .eq('reseller_id', reseller.id)
    .eq('active', true)
    .maybeSingle();

  return (
    <StoreView
      storeSlug={slug}
      storeName={reseller.name}
      services={services || []}
      hasActivePayment={Boolean(gateway)}
    />
  );
}

// Gera metadata básica (título da aba) por revendedor
export async function generateMetadata({ params }) {
  const { data: reseller } = await supabaseAdmin
    .from('resellers')
    .select('name')
    .eq('store_slug', params.slug)
    .single();

  return { title: reseller ? `${reseller.name} — Loja` : 'Loja' };
}
