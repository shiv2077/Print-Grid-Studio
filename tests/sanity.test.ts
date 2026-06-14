import { describe, expect, it } from 'vitest';

describe('sanity', () => {
  it('runs vitest and arithmetic still works', () => {
    expect(2 + 2).toBe(4);
  });

  it('verifies money math is integer-stable in paise', () => {
    // PrintGrid Studio stores all money as integer paise. This is a
    // canary: if someone introduces float math in the pricing engine
    // and a test fails because 0.1 + 0.2 !== 0.3, this test will be
    // a useful next-to-it pointer.
    const paise = (rupees: number): number => Math.round(rupees * 100);
    expect(paise(199)).toBe(19900);
    expect(paise(0.1) + paise(0.2)).toBe(30);
  });
});
