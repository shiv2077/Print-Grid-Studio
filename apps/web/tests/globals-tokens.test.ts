import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('globals.css design tokens', () => {
  const css = readFileSync(
    path.resolve(__dirname, '../app/globals.css'),
    'utf8'
  );

  it('defines the new dark/teal revamp tokens on :root', () => {
    expect(css).toMatch(/--canvas:\s*#0A0B0D/);
    expect(css).toMatch(/--surface:\s*#131519/);
    expect(css).toMatch(/--text:\s*#EDEDED/);
    expect(css).toMatch(/--text-secondary:\s*#9CA3AF/);
    expect(css).toMatch(/--text-muted:\s*#6B7280/);
    expect(css).toMatch(/--accent-teal:\s*#2DD4BF/);
    expect(css).toMatch(/--accent-teal-strong:\s*#0D9488/);
    expect(css).toMatch(/--line:\s*rgba\(237,\s*237,\s*237,\s*0\.10\)/);
    expect(css).toMatch(/--line-strong:\s*rgba\(237,\s*237,\s*237,\s*0\.18\)/);
  });

  it('does not remove the existing tokens other, not-yet-migrated pages depend on', () => {
    expect(css).toMatch(/--ink:\s*#0A0A0A/);
    expect(css).toMatch(/--paper:\s*#FAFAF7/);
    expect(css).toMatch(/--accent:\s*#BC3A14/);
  });
});
