// app/loja/[slug]/sucesso/page.jsx
// Página simples para onde o Mercado Pago redireciona o cliente após o
// pagamento aprovado (back_urls.success em create-order-mercadopago.js).

const COLORS = {
  bg: '#0A0F1C',
  surface: '#121A2B',
  border: '#232D45',
  textPrimary: '#E7ECF6',
  textSecondary: '#7C8BA8',
  healthy: '#45D483',
};

export default function SucessoPage({ params }) {
  return (
    <div
      style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}
      className="flex items-center justify-center p-6"
    >
      <div
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
        className="max-w-md w-full rounded-2xl border p-8 text-center"
      >
        <div
          style={{ background: 'rgba(69,212,131,0.15)', color: COLORS.healthy }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-5"
        >
          ✓
        </div>
        <h1 style={{ color: COLORS.textPrimary }} className="text-xl font-semibold mb-2">
          Pagamento confirmado
        </h1>
        <p style={{ color: COLORS.textSecondary }} className="text-sm mb-6">
          Seu pedido já está em processamento. Isso costuma levar poucos minutos —
          você não precisa fazer mais nada.
        </p>
        <a
          href={`/loja/${params.slug}`}
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
          className="inline-block text-xs px-4 py-2 rounded-md border hover:brightness-125 transition"
        >
          Voltar para a loja
        </a>
      </div>
    </div>
  );
}
