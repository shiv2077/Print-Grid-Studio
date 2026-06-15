import type { MetadataRoute } from 'next';

const BASE_URL = 'https://printgridstudio.com';

export default function robots(): MetadataRoute.Robots {
  // Block crawlers on Vercel preview deploys; allow on production.
  // NEXT_PUBLIC_VERCEL_ENV is "production" | "preview" | "development".
  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
  if (!isProd) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/orders/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
