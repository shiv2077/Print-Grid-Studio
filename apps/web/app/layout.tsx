import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { StatusStrip } from '@/components/layout/StatusStrip';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PrintGrid Studio — FDM 3D printing. Quoted live. Printed locally.',
    template: '%s · PrintGrid Studio',
  },
  description:
    'FDM 3D printing studio in Chennai. Upload an STL, see a real price computed from the actual mesh, ship pan-India in four days.',
};

// Set the theme before first paint so there's no flash of the wrong palette.
const themeInit = `(function(){try{var k='printgrid-theme';var s=localStorage.getItem(k);var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',s||p);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <StatusStrip />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
