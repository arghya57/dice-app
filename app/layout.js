export const metadata = { title: 'Dice App', description: 'শুধু প্রাপ্তবয়স্ক দম্পতির জন্য' };
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0210' };

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Hind Siliguri', sans-serif", background: '#0b0210', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
