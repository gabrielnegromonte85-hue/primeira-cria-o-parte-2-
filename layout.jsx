export const metadata = {
  title: 'SocialBoost',
  description: 'Crescimento no Instagram',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
