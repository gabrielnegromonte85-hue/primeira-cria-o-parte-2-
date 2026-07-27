// pages/api/save-account.js
// Salva a seção "Dados da conta" do ConfiguracoesView.jsx.
// E-mail é o de login (Supabase Auth) — se mudar, atualiza lá também,
// não só na tabela `resellers`.

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { requireReseller } from '../../lib/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await requireReseller(req, res);
  if (!session) return;

  try {
    const { name, whatsapp, email } = req.body;

    if (!name || !whatsapp) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const { error: resellerError } = await supabaseAdmin
      .from('resellers')
      .update({ name, whatsapp })
      .eq('id', session.resellerId);

    if (resellerError) {
      console.error('Erro ao salvar conta:', resellerError.message);
      return res.status(500).json({ error: 'Não foi possível salvar' });
    }

    // E-mail de login é gerenciado pelo Supabase Auth, não pela tabela
    // resellers — só atualiza se realmente mudou.
    if (email && email !== session.user.email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        session.user.id,
        { email }
      );
      if (emailError) {
        return res.status(200).json({
          ok: true,
          warning: 'Conta salva, mas não foi possível atualizar o e-mail de login.',
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro em save-account:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
