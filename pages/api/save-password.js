// pages/api/save-password.js
// Salva a seção "Senha" do ConfiguracoesView.jsx. A senha nunca é
// salva em `resellers` — quem guarda (com hash forte, salt, etc.) é
// o próprio Supabase Auth.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { requireReseller } from '../../lib/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return;

  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(session.user.id, {
      password,
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error.message);
      return res.status(500).json({ error: 'Não foi possível atualizar a senha' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro em save-password:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
