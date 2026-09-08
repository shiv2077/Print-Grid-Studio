import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { NavPill } from './_components/NavPill';
import { V2SmoothScroll } from './_components/V2SmoothScroll';
import { PageTransition } from './_components/PageTransition';
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, BUSINESS } from '@/lib/site';
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

const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    '3D printing', 'FDM 3D printing', 'Chennai 3D printing', 'online STL quote',
    '3D printing service India', 'PLA', 'PETG', 'ABS', 'TPU', 'PA-CF',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

// LocalBusiness structured data (JSON-LD).
const localBusinessLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  email: BUSINESS.email,
  telephone: BUSINESS.phone,
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS.locality,
    addressRegion: BUSINESS.region,
    addressCountry: BUSINESS.country,
  },
  areaServed: { '@type': 'Country', name: 'India' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />
        <div className="v2-root">
          <V2SmoothScroll>
            <div className="v2-gridlines" aria-hidden="true"><div className="v2-gridlines__band" /></div>
            <NavPill />
            <PageTransition>
              <main id="main">{children}</main>
            </PageTransition>
          </V2SmoothScroll>
        </div>
      </body>
    </html>
  );
}
