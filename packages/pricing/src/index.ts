// lib/pricing.ts
// PrintGrid Studio pricing engine. Authoritative source of pricing math.
// All money in INTEGER PAISE. Never floats. Never rupees in storage.
// Reusable in client components, server components, and (eventually) Node API routes.

export type MaterialKey =
  | 'pla-plus' | 'pla-lw' | 'petg' | 'abs' | 'tpu-95a' | 'pa6' | 'pa-cf';

export type LayerHeight = '0.12' | '0.16' | '0.20' | '0.24' | '0.28';
export type Finish = 'as-printed' | 'sanded' | 'primer' | 'gloss';
export type PromoCode = 'FIRSTPRINT' | 'DRONE25' | 'FOUNDER';

export interface MaterialSpec {
  name: string;
  ratePerGramPaise: number;
  density: number; // g/cm³
  maxTempC: number;
  tensileMpa: number;
}

export const MATERIALS: Readonly<Record<MaterialKey, MaterialSpec>> = {
  'pla-plus': { name: 'PLA+',    ratePerGramPaise: 450,  density: 1.24, maxTempC: 60,  tensileMpa: 65 },
  'pla-lw':   { name: 'PLA LW',  ratePerGramPaise: 1800, density: 0.65, maxTempC: 55,  tensileMpa: 35 },
  'petg':     { name: 'PETG',    ratePerGramPaise: 600,  density: 1.27, maxTempC: 75,  tensileMpa: 50 },
  'abs':      { name: 'ABS',     ratePerGramPaise: 650,  density: 1.04, maxTempC: 95,  tensileMpa: 40 },
  'tpu-95a':  { name: 'TPU 95A', ratePerGramPaise: 1100, density: 1.21, maxTempC: 80,  tensileMpa: 30 },
  'pa6':      { name: 'PA6',     ratePerGramPaise: 2000, density: 1.14, maxTempC: 110, tensileMpa: 65 },
  'pa-cf':    { name: 'PA-CF',   ratePerGramPaise: 2100, density: 1.16, maxTempC: 130, tensileMpa: 90 },
};

export const LAYER_MULTIPLIERS: Readonly<Record<LayerHeight, number>> = {
  '0.28': 0.85,
  '0.24': 0.95,
  '0.20': 1.00,
  '0.16': 1.15,
  '0.12': 1.35,
};

export const FINISHES: Readonly<Record<Finish, number>> = {
  'as-printed': 0,
  'sanded':     7500,
  'primer':     9000,
  'gloss':      28000,
};

export const STUDIO_DEFAULTS = Object.freeze({
  infillPct: 20,
  walls: 3,
  shellFraction: 0.18,
});

const SETUP_FEE_PAISE   = 10000;
const RUSH_PCT          = 0.25;
const MULTICOLOR_MULT   = 1.20;
const MIN_ORDER_PAISE   = 19900;
const SHIPPING_PAISE    = 12000;
const FREE_SHIP_THRESH  = 250000;
const PAYMENT_FEE_PCT   = 0.02;
const GST_RATE          = 0.18;

const QTY_DISCOUNTS: ReadonlyArray<{ minQty: number; pct: number }> = [
  { minQty: 50, pct: 0.15 },
  { minQty: 20, pct: 0.10 },
  { minQty: 10, pct: 0.05 },
];

export const PROMOS: Readonly<Record<PromoCode, { type: 'pct' | 'flat'; value: number }>> = {
  FIRSTPRINT: { type: 'pct',  value: 0.10 },
  DRONE25:    { type: 'pct',  value: 0.25 },
  FOUNDER:    { type: 'flat', value: 50000 },
};

export interface FileInput {
  massGrams: number;
  materialKey: MaterialKey;
  layerHeight: LayerHeight;
  finish: Finish;
  multicolor: boolean;
  qty: number;
}

export interface QuoteInput {
  files: FileInput[];
  rush?: boolean;
  promo?: PromoCode | null;
  addressState?: string | null;
}

export interface LineItem extends FileInput {
  fileIndex: number;
  materialPaise: number;
  perUnitPaise: number;
  qtyDiscountPct: number;
  lineSubtotalPaise: number;
}

export interface QuoteResult {
  lineItems: LineItem[];
  setupTotalPaise: number;
  rushFeePaise: number;
  promoDiscountPaise: number;
  appliedPromo: PromoCode | null;
  minTopUpPaise: number;
  subtotalPaise: number;
  shippingPaise: number;
  paymentFeePaise: number;
  grandTotalPaise: number;
  exGstPaise: number;
  gstTotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
}

export function computeMass(volumeMm3: number, materialKey: MaterialKey): number {
  const m = MATERIALS[materialKey];
  if (!m) throw new Error(`Unknown material: ${materialKey}`);
  if (volumeMm3 <= 0) throw new Error(`Invalid volume: ${volumeMm3}`);
  const volumeCm3 = volumeMm3 / 1000;
  const massFactor = STUDIO_DEFAULTS.shellFraction
                   + (1 - STUDIO_DEFAULTS.shellFraction) * (STUDIO_DEFAULTS.infillPct / 100);
  return volumeCm3 * m.density * massFactor;
}

const qtyDiscountFor = (qty: number): number =>
  QTY_DISCOUNTS.find(d => qty >= d.minQty)?.pct ?? 0;

export function quote(input: QuoteInput): QuoteResult {
  const { files, rush = false, promo = null, addressState = null } = input;
  if (!files.length) throw new Error('At least one file required');

  const lineItems: LineItem[] = files.map((f, i) => {
    const material = MATERIALS[f.materialKey];
    const layerMult = LAYER_MULTIPLIERS[f.layerHeight];
    const finishPaise = FINISHES[f.finish];
    if (!material) throw new Error(`File ${i}: unknown material`);
    if (layerMult === undefined) throw new Error(`File ${i}: unknown layer`);
    if (finishPaise === undefined) throw new Error(`File ${i}: unknown finish`);
    if (f.qty < 1) throw new Error(`File ${i}: qty must be >= 1`);
    if (f.massGrams <= 0) throw new Error(`File ${i}: massGrams must be > 0`);

    const materialPaise = Math.round(f.massGrams * material.ratePerGramPaise);
    const afterLayer = materialPaise * layerMult;
    const beforeMulticolor = afterLayer + finishPaise;
    const perUnitFloat = f.multicolor ? beforeMulticolor * MULTICOLOR_MULT : beforeMulticolor;
    const perUnitPaise = Math.round(perUnitFloat);

    const qtyDiscountPct = qtyDiscountFor(f.qty);
    const lineSubtotalPaise = Math.round(perUnitPaise * f.qty * (1 - qtyDiscountPct));

    return {
      ...f,
      fileIndex: i,
      materialPaise,
      perUnitPaise,
      qtyDiscountPct,
      lineSubtotalPaise,
    };
  });

  const lineSubtotalSum = lineItems.reduce((s, li) => s + li.lineSubtotalPaise, 0);
  const setupTotalPaise = files.length * SETUP_FEE_PAISE;
  const beforeRush = lineSubtotalSum + setupTotalPaise;
  const rushFeePaise = rush ? Math.round(beforeRush * RUSH_PCT) : 0;
  const beforePromo = beforeRush + rushFeePaise;

  let promoDiscountPaise = 0;
  let appliedPromo: PromoCode | null = null;
  if (promo && PROMOS[promo]) {
    const p = PROMOS[promo];
    promoDiscountPaise = p.type === 'pct'
      ? Math.round(beforePromo * p.value)
      : Math.min(p.value, beforePromo);
    appliedPromo = promo;
  }

  const afterPromo = beforePromo - promoDiscountPaise;
  const minTopUpPaise = Math.max(0, MIN_ORDER_PAISE - afterPromo);
  const subtotalPaise = Math.max(afterPromo, MIN_ORDER_PAISE);
  const shippingPaise = subtotalPaise >= FREE_SHIP_THRESH ? 0 : SHIPPING_PAISE;
  const beforePayFee = subtotalPaise + shippingPaise;
  const paymentFeePaise = Math.round(beforePayFee * PAYMENT_FEE_PCT);
  const grandTotalPaise = beforePayFee + paymentFeePaise;

  const exGstPaise = Math.round(grandTotalPaise / (1 + GST_RATE));
  const gstTotalPaise = grandTotalPaise - exGstPaise;
  let cgstPaise = 0, sgstPaise = 0, igstPaise = 0;
  if (addressState === 'Tamil Nadu') {
    cgstPaise = Math.round(gstTotalPaise / 2);
    sgstPaise = gstTotalPaise - cgstPaise;
  } else if (addressState) {
    igstPaise = gstTotalPaise;
  }

  return {
    lineItems,
    setupTotalPaise,
    rushFeePaise,
    promoDiscountPaise,
    appliedPromo,
    minTopUpPaise,
    subtotalPaise,
    shippingPaise,
    paymentFeePaise,
    grandTotalPaise,
    exGstPaise,
    gstTotalPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
  };
}

export function formatINR(paise: number): string {
  if (typeof paise !== 'number') return '—';
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
