// pages/api/save-store.js
// Salva a seção "Loja" do ConfiguracoesView.jsx (nome e slogan).
// O slug (store_slug) NÃO é editável aqui de propósito — ele é gerado
// no cadastro e usado na URL pública (/loja/[slug]); trocar exigiria
// atualizar links já compartilhados pelo revendedor.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { requireReseller } from '../../lib/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return;

  try {
    const { storeName, slogan } = req.body;

    if (!storeName) {
      return res.status(400).json({ error: 'Nome da loja é obrigatório' });
    }

    const { error } = await supabaseAdmin
      .from('resellers')
      .update({ store_name: storeName, slogan: slogan || null })
      .eq('id', session.resellerId);

    if (error) {
      console.error('Erro ao salvar loja:', error.message);
      return res.status(500).json({ error: 'Não foi possível salvar' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro em save-store:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
