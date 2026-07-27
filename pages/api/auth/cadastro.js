// pages/api/auth/cadastro.js
// Cria o usuário no Supabase Auth (via service role, para já vir
// confirmado — sem exigir clique em e-mail) e a linha correspondente
// em `resellers`, ligadas pelo `user_id`. Se a criação do reseller
// falhar, desfaz a criação do usuário (evita conta "fantasma" sem
// perfil).

import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { name, whatsapp, email, password, storeSlug } = req.body;

    if (!name || !email || !password || !storeSlug) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres' });
    }

    // 1) Garante que o slug da loja é único antes de criar qualquer coisa
    const { data: existingSlug } = await supabaseAdmin
      .from('resellers')
      .select('id')
      .eq('store_slug', storeSlug)
      .maybeSingle();

    if (existingSlug) {
      return res.status(409).json({ error: 'Já existe uma loja com esse nome. Tente outro.' });
    }

    // 2) Cria o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      const message =
        authError.message?.includes('already') ? 'Este e-mail já está cadastrado.' : 'Não foi possível criar a conta.';
      return res.status(400).json({ error: message });
    }

    // 3) Cria o perfil do revendedor, ligado ao usuário recém-criado
    const { error: resellerError } = await supabaseAdmin.from('resellers').insert({
      name,
      whatsapp: whatsapp || null,
      store_slug: storeSlug,
      user_id: authData.user.id,
      plan: 'inicial',
      status: 'healthy',
    });

    if (resellerError) {
      // Desfaz a criação do usuário de auth para não deixar conta órfã
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Erro ao criar reseller:', resellerError.message);
      return res.status(500).json({ error: 'Não foi possível concluir o cadastro.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro em /api/auth/cadastro:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
