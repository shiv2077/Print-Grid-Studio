import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="wordmark" href="/" aria-label="PrintGrid Studio home">
          PrintGrid
          <span className="wordmark__sub">Studio · 3D printing</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} className="nav-link" href={link.href}>
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link className="btn btn-primary" href="/quote">
            Get a quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
