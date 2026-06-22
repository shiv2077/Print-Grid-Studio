import type { Metadata } from 'next';
import { NavPill } from './_components/NavPill';
import './v2.css';

// Preview route — not for indexing until approved (keeps it from competing with
// the live homepage for SEO).
export const metadata: Metadata = {
  title: 'PrintGrid Studio — v2 preview',
  robots: { index: false, follow: false },
  alternates: { canonical: '/v2' },
};

// Hide the live site chrome (status strip / header / footer) for the v2 route
// ONLY. This <style> is rendered inside the v2 layout subtree, so it is present
// solely in /v2's HTML and is removed on client navigation away — other routes
// are never affected. No existing file is modified.
const HIDE_CHROME = `
  .status-strip, .site-header, .site-footer { display: none !important; }
  body { background: #0A0A0A; }
  main#main { padding: 0; margin: 0; }
`;

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2-root">
      <style dangerouslySetInnerHTML={{ __html: HIDE_CHROME }} />
      <div className="v2-gridlines" aria-hidden="true"><div className="v2-gridlines__band" /></div>
      <NavPill />
      {children}
    </div>
  );
}
