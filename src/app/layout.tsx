import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-preps',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PREPS — Diseñado para tu rendimiento',
  description: 'PREPS. Alimentación diseñada para tu rendimiento.',
  metadataBase: new URL('https://preps.cl'),
  icons: { icon: '/img/logo-preps.png', apple: '/img/logo-preps.png' },
};


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body>
        {children}
        {/* El widget flotante repetía el Protocolo en todas las páginas. Esa
            información vive en /protocolo, enlazada desde el carrito y desde
            Nosotros. El archivo queda en public/ por si se retoma. */}
      </body>
    </html>
  );
}
