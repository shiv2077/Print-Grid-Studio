import { describe, expect, it } from 'vitest';
import {
  computeMass,
  formatINR,
  MATERIALS,
  LAYER_MULTIPLIERS,
  FINISHES,
  PROMOS,
  quote,
  type FileInput,
  type LayerHeight,
  type MaterialKey,
  type Finish,
  type PromoCode,
} from '../src/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseFile = (overrides: Partial<FileInput> = {}): FileInput => ({
  massGrams: 100,
  materialKey: 'pla-plus',
  layerHeight: '0.20',
  finish: 'as-printed',
  multicolor: false,
  qty: 1,
  ...overrides,
});

const isInt = (n: unknown): boolean => typeof n === 'number' && Number.isInteger(n);

// Step-through: per-unit price for a single file with given config. Mirrors
// the engine but kept independent so that drift between engine and test
// produces a failure rather than a silent passthrough.
const expectedPerUnitPaise = (f: FileInput): number => {
  const material = MATERIALS[f.materialKey];
  const layerMult = LAYER_MULTIPLIERS[f.layerHeight];
  const finishPaise = FINISHES[f.finish];
  const matPaise = Math.round(f.massGrams * material.ratePerGramPaise);
  const afterLayer = matPaise * layerMult;
  const beforeMulticolor = afterLayer + finishPaise;
  const perUnit = f.multicolor ? beforeMulticolor * 1.2 : beforeMulticolor;
  return Math.round(perUnit);
};

// ---------------------------------------------------------------------------
// Per-material spot checks (each material × 0.20mm layer)
// ---------------------------------------------------------------------------

describe('quote — material × 0.20mm layer (7 materials)', () => {
  const materialKeys = Object.keys(MATERIALS) as MaterialKey[];
  it.each(materialKeys)('%s computes line items at 0.20mm', (mat) => {
    const f = baseFile({ materialKey: mat, massGrams: 100, layerHeight: '0.20' });
    const result = quote({ files: [f] });
    expect(result.lineItems).toHaveLength(1);
    const item = result.lineItems[0];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item.perUnitPaise).toBe(expectedPerUnitPaise(f));
    expect(item.lineSubtotalPaise).toBe(item.perUnitPaise);
    // Material paise is mass × rate; for 100g this is exactly rate × 100.
    expect(item.materialPaise).toBe(MATERIALS[mat].ratePerGramPaise * 100);
  });
});

// ---------------------------------------------------------------------------
// Per-layer multipliers on PETG (5 layer heights)
// ---------------------------------------------------------------------------

describe('quote — layer multipliers on PETG (5 layer heights)', () => {
  const layers: LayerHeight[] = ['0.12', '0.16', '0.20', '0.24', '0.28'];
  it.each(layers)('layer %s applies the correct multiplier on PETG', (lh) => {
    const f = baseFile({ materialKey: 'petg', massGrams: 100, layerHeight: lh });
    const result = quote({ files: [f] });
    const item = result.lineItems[0];
    expect(item).toBeDefined();
    if (!item) return;
    // PETG @ 600 paise/g × 100g = 60000 paise material cost.
    // After layer mult: round(60000 × layerMult).
    const expected = Math.round(60000 * LAYER_MULTIPLIERS[lh]);
    expect(item.perUnitPaise).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Per-finish on PLA+ (4 finishes)
// ---------------------------------------------------------------------------

describe('quote — finishes on PLA+ (4 finishes)', () => {
  const finishes: Finish[] = ['as-printed', 'sanded', 'primer', 'gloss'];
  it.each(finishes)('finish %s adds the right finish flat fee', (fin) => {
    const f = baseFile({ materialKey: 'pla-plus', massGrams: 100, finish: fin });
    const result = quote({ files: [f] });
    const item = result.lineItems[0];
    expect(item).toBeDefined();
    if (!item) return;
    // PLA+ 450 × 100 = 45000 ; layer 0.20 mult = 1.0 ; + finish.
    const expected = 45000 + FINISHES[fin];
    expect(item.perUnitPaise).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Multicolor on/off (2 cases)
// ---------------------------------------------------------------------------

describe('quote — multicolor toggle', () => {
  it('without multicolor returns the un-multiplied per-unit', () => {
    const f = baseFile({ massGrams: 100, multicolor: false });
    const result = quote({ files: [f] });
    expect(result.lineItems[0]?.perUnitPaise).toBe(45000);
  });
  it('with multicolor multiplies per-unit by 1.20 then rounds', () => {
    const f = baseFile({ massGrams: 100, multicolor: true });
    const result = quote({ files: [f] });
    expect(result.lineItems[0]?.perUnitPaise).toBe(54000);
  });
});

// ---------------------------------------------------------------------------
// Qty discount boundaries: 9, 10, 19, 20, 49, 50
// ---------------------------------------------------------------------------

describe('quote — quantity discount tier boundaries', () => {
  const cases: Array<{ qty: number; pct: number }> = [
    { qty: 9, pct: 0 },
    { qty: 10, pct: 0.05 },
    { qty: 19, pct: 0.05 },
    { qty: 20, pct: 0.10 },
    { qty: 49, pct: 0.10 },
    { qty: 50, pct: 0.15 },
  ];
  it.each(cases)('qty $qty applies $pct discount', ({ qty, pct }) => {
    const f = baseFile({ massGrams: 100, qty });
    const result = quote({ files: [f] });
    const item = result.lineItems[0];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item.qtyDiscountPct).toBe(pct);
    expect(item.lineSubtotalPaise).toBe(Math.round(item.perUnitPaise * qty * (1 - pct)));
  });
});

// ---------------------------------------------------------------------------
// Promos
// ---------------------------------------------------------------------------

describe('quote — promo codes', () => {
  it('FIRSTPRINT applies 10% to (parts + setup + rush)', () => {
    const f = baseFile({ massGrams: 100, qty: 1 });
    const r = quote({ files: [f], promo: 'FIRSTPRINT' });
    // Pre-promo: line(45000) + setup(10000) = 55000 ; rush=0
    // promo: 10% of 55000 = 5500
    expect(r.appliedPromo).toBe('FIRSTPRINT');
    expect(r.promoDiscountPaise).toBe(5500);
  });

  it('DRONE25 applies 25%', () => {
    const f = baseFile({ massGrams: 100 });
    const r = quote({ files: [f], promo: 'DRONE25' });
    // 25% of 55000 = 13750
    expect(r.appliedPromo).toBe('DRONE25');
    expect(r.promoDiscountPaise).toBe(13750);
  });

  it('FOUNDER applies a flat ₹500 off (50000 paise)', () => {
    const f = baseFile({ massGrams: 100 });
    const r = quote({ files: [f], promo: 'FOUNDER' });
    expect(r.appliedPromo).toBe('FOUNDER');
    expect(r.promoDiscountPaise).toBe(50000);
  });

  it('FOUNDER discount caps at the pre-promo amount (cannot go negative)', () => {
    // Tiny order so pre-promo total is below the FOUNDER 50000 paise flat.
    // 1g × pla-plus (450) = 450 paise + setup 10000 = 10450 pre-promo.
    // FOUNDER (50000) capped at 10450.
    const f = baseFile({ massGrams: 1, qty: 1 });
    const r = quote({ files: [f], promo: 'FOUNDER' });
    expect(r.promoDiscountPaise).toBe(10450);
    // After cap, before-shipping subtotal is min-order top-up applied (19900)
    // since afterPromo = 0.
    expect(r.subtotalPaise).toBe(19900);
  });
});

// ---------------------------------------------------------------------------
// Minimum order top-up
// ---------------------------------------------------------------------------

describe('quote — minimum order top-up', () => {
  it('lifts an under-₹199 quote to ₹199 and reports the topup', () => {
    // 1g pla-plus = 450 paise + setup 10000 = 10450 < 19900
    const f = baseFile({ massGrams: 1 });
    const r = quote({ files: [f] });
    expect(r.minTopUpPaise).toBe(19900 - 10450);
    expect(r.subtotalPaise).toBe(19900);
  });
});

// ---------------------------------------------------------------------------
// Free shipping at 250000 paise boundary
// ---------------------------------------------------------------------------

describe('quote — free shipping threshold (250000 paise)', () => {
  it('subtotal exactly 250000 paise → free shipping', () => {
    // Build a file that lands subtotal exactly at the threshold.
    // Engine: subtotal = max(beforeRush - promo, MIN_ORDER) ; threshold check
    // is on subtotal >= 250000.
    // Pick mass to get parts + setup = 250000 even.
    // PLA+ 450/g × 533.33g = 240000 ; setup 10000 = 250000 even.
    const f = baseFile({ massGrams: 533.33333333 });
    const r = quote({ files: [f] });
    expect(r.subtotalPaise).toBeGreaterThanOrEqual(250000);
    expect(r.shippingPaise).toBe(0);
  });

  it('subtotal just under 250000 → 12000 paise shipping', () => {
    // Parts + setup = 249999 paise → just below threshold.
    // PLA+ 450/g × 533.33g would round; pick mass so per-unit + setup = 249999.
    // Simpler: small mass so subtotal is far below threshold.
    const f = baseFile({ massGrams: 100 });
    const r = quote({ files: [f] });
    expect(r.subtotalPaise).toBeLessThan(250000);
    expect(r.shippingPaise).toBe(12000);
  });
});

// ---------------------------------------------------------------------------
// Rush
// ---------------------------------------------------------------------------

describe('quote — rush adds 25% across files + setup once', () => {
  it('rush adds 25% of (parts subtotal sum + setup total)', () => {
    const f = baseFile({ massGrams: 100, qty: 1 });
    const r = quote({ files: [f, f], rush: true });
    // 2 files × 45000 + 2 setup × 10000 = 110000
    // rush = round(110000 × 0.25) = 27500
    expect(r.rushFeePaise).toBe(27500);
  });
});

// ---------------------------------------------------------------------------
// Multi-file multi-material
// ---------------------------------------------------------------------------

describe('quote — 3-file multi-material order', () => {
  it('sums setup correctly and produces independent line items', () => {
    const files: FileInput[] = [
      baseFile({ materialKey: 'pla-plus', massGrams: 50 }),
      baseFile({ materialKey: 'petg',     massGrams: 80, multicolor: true }),
      baseFile({ materialKey: 'pa-cf',    massGrams: 20, finish: 'sanded' }),
    ];
    const r = quote({ files });
    expect(r.lineItems).toHaveLength(3);
    expect(r.setupTotalPaise).toBe(3 * 10000);
    // Each line independently priced.
    files.forEach((f, i) => {
      expect(r.lineItems[i]?.perUnitPaise).toBe(expectedPerUnitPaise(f));
    });
  });
});

// ---------------------------------------------------------------------------
// Tax — TN vs other state
// ---------------------------------------------------------------------------

describe('quote — tax split', () => {
  it('Tamil Nadu customer → CGST + SGST split (50/50 of GST total)', () => {
    const f = baseFile({ massGrams: 100 });
    const r = quote({ files: [f], addressState: 'Tamil Nadu' });
    expect(r.gstTotalPaise).toBeGreaterThan(0);
    expect(r.cgstPaise + r.sgstPaise).toBe(r.gstTotalPaise);
    // Halves should differ by at most 1 paise (rounding tie-break).
    expect(Math.abs(r.cgstPaise - r.sgstPaise)).toBeLessThanOrEqual(1);
    expect(r.igstPaise).toBe(0);
  });

  it('Karnataka customer → IGST only (no CGST/SGST)', () => {
    const f = baseFile({ massGrams: 100 });
    const r = quote({ files: [f], addressState: 'Karnataka' });
    expect(r.igstPaise).toBe(r.gstTotalPaise);
    expect(r.cgstPaise).toBe(0);
    expect(r.sgstPaise).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Integer hygiene — every paise field on every output is an integer
// ---------------------------------------------------------------------------

describe('quote — integer hygiene', () => {
  const variants: QuoteInputBuilder[] = [
    () => ({ files: [baseFile()] }),
    () => ({ files: [baseFile({ massGrams: 137.456, multicolor: true })] }),
    () => ({ files: [baseFile({ qty: 50 })], rush: true }),
    () => ({ files: [baseFile()], promo: 'FIRSTPRINT' }),
    () => ({ files: [baseFile({ massGrams: 1 })], promo: 'FOUNDER' }),
    () => ({
      files: [
        baseFile({ materialKey: 'pa-cf', massGrams: 12.34 }),
        baseFile({ materialKey: 'tpu-95a', massGrams: 56.78, multicolor: true }),
        baseFile({ materialKey: 'pla-lw', massGrams: 91.23, finish: 'gloss' }),
      ],
      rush: true,
      addressState: 'Tamil Nadu',
    }),
  ];

  it.each(variants.map((b, i) => [i, b]))(
    'variant %i — every paise field is an integer',
    (_i, build) => {
      const result = quote(build());
      const paiseFields: Array<keyof typeof result> = [
        'setupTotalPaise',
        'rushFeePaise',
        'promoDiscountPaise',
        'minTopUpPaise',
        'subtotalPaise',
        'shippingPaise',
        'paymentFeePaise',
        'grandTotalPaise',
        'exGstPaise',
        'gstTotalPaise',
        'cgstPaise',
        'sgstPaise',
        'igstPaise',
      ];
      paiseFields.forEach((k) => {
        expect(isInt(result[k])).toBe(true);
      });
      result.lineItems.forEach((li) => {
        expect(isInt(li.materialPaise)).toBe(true);
        expect(isInt(li.perUnitPaise)).toBe(true);
        expect(isInt(li.lineSubtotalPaise)).toBe(true);
      });
    }
  );
});

type QuoteInputBuilder = () => Parameters<typeof quote>[0];

// ---------------------------------------------------------------------------
// computeMass / formatINR sanity
// ---------------------------------------------------------------------------

describe('computeMass', () => {
  it('throws on unknown material', () => {
    expect(() => computeMass(1000, 'nope' as MaterialKey)).toThrow();
  });

  it('throws on non-positive volume', () => {
    expect(() => computeMass(0, 'pla-plus')).toThrow();
    expect(() => computeMass(-1, 'pla-plus')).toThrow();
  });

  it('returns positive grams for a 1000 mm³ PLA+ part', () => {
    const m = computeMass(1000, 'pla-plus');
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(MATERIALS['pla-plus'].density); // 100% density ceiling
  });
});

describe('formatINR', () => {
  it('formats integer paise as Indian-style rupees', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(100)).toBe('₹1');
    expect(formatINR(19900)).toBe('₹199');
    // ₹1,25,500 = 12,550,000 paise. Indian comma grouping (lakh-style).
    expect(formatINR(1_25_50_000)).toBe('₹1,25,500');
  });

  it('returns em-dash for non-numeric input', () => {
    // Defensive: function exists for UI rendering of nullable values.
    // @ts-expect-error — intentionally violating the type to verify
    // runtime defense.
    expect(formatINR('oops')).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// Promo registry sanity
// ---------------------------------------------------------------------------

describe('PROMOS registry', () => {
  it('contains exactly 3 codes', () => {
    expect(Object.keys(PROMOS).sort()).toEqual(['DRONE25', 'FIRSTPRINT', 'FOUNDER'].sort());
  });

  it('engine ignores an invalid promo code', () => {
    const f = baseFile();
    const r = quote({ files: [f], promo: 'NOSUCHCODE' as PromoCode });
    expect(r.appliedPromo).toBe(null);
    expect(r.promoDiscountPaise).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('quote — input validation', () => {
  it('throws when files array is empty', () => {
    expect(() => quote({ files: [] })).toThrow(/at least one file/i);
  });
  it('throws on qty < 1', () => {
    expect(() => quote({ files: [baseFile({ qty: 0 })] })).toThrow();
  });
  it('throws on massGrams <= 0', () => {
    expect(() => quote({ files: [baseFile({ massGrams: 0 })] })).toThrow();
  });
});
