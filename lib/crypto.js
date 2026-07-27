// lib/crypto.js
// Criptografa/descriptografa tokens sensíveis (Access Token do Mercado Pago,
// API Key do painel SMM) antes de salvar ou depois de ler do banco.
//
// NUNCA salve esses tokens em texto puro — se o banco for exposto/vazado,
// os tokens dos revendedores (que dão acesso ao dinheiro e ao painel deles)
// ficariam expostos junto.
//
// Requer a variável de ambiente ENCRYPTION_KEY: uma chave de 32 bytes em
// hexadecimal (64 caracteres). Gere uma com:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Guarde essa chave APENAS nas variáveis de ambiente do servidor (Vercel),
// nunca no código nem no banco.

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY ausente ou inválida — precisa ser uma string hex de 64 caracteres (32 bytes).'
    );
  }
  return Buffer.from(hex, 'hex');
}

// Retorna uma string única: iv:authTag:cipherText (tudo em hex),
// pronta para salvar numa coluna text no banco.
export function encrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // recomendado para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// Recebe a string salva no banco e devolve o valor original em texto puro.
export function decrypt(stored) {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = stored.split(':');

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Formato de dado criptografado inválido.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// Útil pra mostrar só os últimos 4 caracteres no front-end (como já faz o
// PagamentosView.jsx com tokenMasked), sem nunca expor o valor real.
export function maskToken(plainText) {
  return `••••••••${plainText.slice(-4)}`;
}
