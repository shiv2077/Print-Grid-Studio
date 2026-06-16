import { describe, expect, it } from 'vitest';
import sitemap from '../app/sitemap';
import { SITE_URL } from '../lib/site';

describe('SEO', () => {
  it('SITE_URL defaults to the real domain', () => {
    expect(SITE_URL).toMatch(/printgrid\.co\.in$/);
    expect(SITE_URL).not.toMatch(/printgridstudio\.com/);
  });

  it('sitemap includes the key routes and only uses SITE_URL', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/quote`);
    expect(urls).toContain(`${SITE_URL}/materials`);
    expect(urls.every((u) => u.startsWith(SITE_URL))).toBe(true);
    // order pages must not be in the sitemap
    expect(urls.some((u) => u.includes('/orders'))).toBe(false);
  });
});
