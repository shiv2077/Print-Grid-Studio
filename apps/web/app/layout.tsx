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
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PrintGrid Studio — Custom 3D printing in Chennai',
    template: '%s · PrintGrid Studio',
  },
  description:
    'A small Chennai studio printing custom parts on Bambu P1S printers. Real materials, honest prices, ships pan-India in 4 days.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <StatusStrip />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
