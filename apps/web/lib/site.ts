// Single source for site identity used by metadata, robots, sitemap, JSON-LD.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://printgrid.co.in').replace(/\/+$/, '');
export const SITE_NAME = 'PrintGrid Studio';
export const SITE_TAGLINE = 'FDM 3D printing. Quoted live. Printed locally.';
export const SITE_DESCRIPTION =
  'FDM 3D printing studio in Chennai. Upload an STL, see a real price computed from the actual mesh, ship pan-India in four days.';

export const BUSINESS = {
  email: 'aadharsh.j10@gmail.com',
  phone: '+91 75400 23670',
  locality: 'Chennai',
  region: 'Tamil Nadu',
  country: 'IN',
};
