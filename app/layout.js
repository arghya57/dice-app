export const metadata = { title: 'Dice App' };

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#1a1a2e', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
