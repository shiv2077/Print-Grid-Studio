// PrintGrid Studio — pricing engine
// All money in PAISE (1 INR = 100 paise). No floats for currency arithmetic.
// ES module. No dependencies.
//
// Two pure functions:
//   computeQuote(files, defaults, { rush, promoCode })
//     — quote-stage math; returns a GST-INCLUSIVE subtotal.
//   computeCheckout(quoteSubtotalPaise, { shippingPaise, paymentMethod, gstinProvided })
//     — checkout-stage math; adds shipping + (optional) Razorpay fee.
//
// Per-gram rates are GST-inclusive — GST is NEVER added on top, only
// disclosed as a breakout line at checkout for B2B customers.

export const MATERIALS = {
  "pla-plus": { name: "PLA+",    ratePerGram:  450, density: 1.24 },
  "pla-lw":   { name: "PLA LW",  ratePerGram: 1800, density: 0.65 },
  "petg":     { name: "PETG",    ratePerGram:  600, density: 1.27 },
  "abs":      { name: "ABS",     ratePerGram:  650, density: 1.04 },
  "tpu-95a":  { name: "TPU 95A", ratePerGram: 1100, density: 1.21 },
  "pa6":      { name: "PA6",     ratePerGram: 2000, density: 1.14 },
  "pa-cf":    { name: "PA-CF",   ratePerGram: 2100, density: 1.16 },
};

export const FLOW_MM3_PER_S    = 18;       // P1S in default speed mode — display only, not billed
export const SETUP_PAISE       = 10000;    // ₹100/file (charged once per UNIQUE file)
export const FINISH_PAISE = {
  "as-printed": 0,
  "sanded":     7500,
  "primer":     9000,
  "paint":      28000,
};
export const MIN_ORDER_PAISE   = 19900;    // ₹199
export const BUILD_ENVELOPE_MM = { x: 256, y: 256, z: 256 }; // Bambu P1S — confirmed

// Used by computeCheckout only. GST is for breakout disclosure (rates already
// include GST), Razorpay fee is pass-through (only when paymentMethod === 'razorpay').
export const GST_PCT          = 18;
export const RAZORPAY_FEE_PCT = 2;
export const RUSH_FEE_PCT     = 25;        // 48h dispatch surcharge

// Layer-height pricing multiplier — finer layers = more print time = more cost.
export const LAYER_HEIGHT_MULTIPLIER = {
  0.28: 0.85,   // Draft    · −15%
  0.24: 0.95,   // Fast     · −5%
  0.20: 1.00,   // Standard · baseline
  0.16: 1.15,   // Smooth   · +15%
  0.12: 1.35,   // Fine     · +35%
};

// Hardcoded promo codes for v1 (move to backend table later).
export const PROMO_CODES = {
  "FIRSTPRINT": { type: "percent", value: 10,    label: "First-time discount" },
  "DRONE25":    { type: "percent", value: 25,    label: "Drone builder special" },
  "FOUNDER":    { type: "flat",    value: 50000, label: "Founder's discount" },
};

export function validatePromoCode(codeRaw) {
  if (!codeRaw) return null;
  const code = String(codeRaw).trim().toUpperCase();
  return PROMO_CODES[code] ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// computeQuote — quote-stage math. GST-inclusive throughout.
//
//   files: array of per-file inputs:
//     { filename, volumeCm3, bbox, materialSlug, layerHeight, infillPct, walls }
//   defaults: order-level shared params:
//     { quantity, finish, multicolor }
//   opts: { rush?: boolean, promoCode?: string }
//
// Per-file `materialPaiseTotal` is the all-inclusive contribution × qty:
// material × ratePerGram × layerMult, plus finish per copy, ×1.20 if
// multicolor — finish + multicolor are folded silently per spec.
//
// Order math:
//   partsSum         = Σ(file.materialPaiseTotal) + SETUP × fileCount
//   partsAfterQty    = round(partsSum × qtyMult)            (5/10/15% at qty 10/20/50)
//   linePaise        = max(partsAfterQty, MIN_ORDER)        (₹199 floor)
//   minOrderTopUp    = linePaise − partsAfterQty            (≥ 0)
//   postPromo        = linePaise − promoDiscount            (promo applied on linePaise)
//   rushPaise        = rush ? round(postPromo × 0.25) : 0
//   subtotalPaise    = postPromo + rushPaise                ← headline
//
// Returns { perFile, fileCount, quantity, finish, multicolor, rush,
//           setupTotalPaise, minOrderTopUpPaise, promoDiscountPaise, promoLabel,
//           rushPaise, subtotalPaise, warnings, fitsBuildVolume }
// ─────────────────────────────────────────────────────────────────────
export function computeQuote(files, defaults = {}, { rush = false, promoCode = null } = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('computeQuote expects a non-empty files array');
  }

  const fileCount = files.length;

  // Per-file: each file carries its own qty / finish / multicolor (with
  // defaults as fallback for callers that pass shared values). Every cost
  // component is exposed so the right rail can show a transparent breakdown.
  const perFile = files.map((f) => {
    const material = MATERIALS[f.materialSlug];
    if (!material) throw new Error(`Unknown material: ${f.materialSlug}`);

    const qty           = Math.max(1, Math.floor(f.quantity ?? defaults.quantity ?? 1));
    const finish        = f.finish ?? defaults.finish ?? 'as-printed';
    const multicolor    = !!(f.multicolor ?? defaults.multicolor);
    const finishPerCopy = FINISH_PAISE[finish] ?? 0;
    const qtyMult =
      qty >= 50 ? 0.85 :
      qty >= 20 ? 0.90 :
      qty >= 10 ? 0.95 : 1.0;
    const qtyDiscountPct = Math.round((1 - qtyMult) * 100);

    const shellMm    = Math.max(0.42 * f.walls, 0.84);
    const minDim     = Math.min(f.bbox.x, f.bbox.y, f.bbox.z);
    const innerScale = Math.max(0, (minDim - 2 * shellMm) / minDim);
    const shellFrac  = Math.min(0.6, 1 - innerScale ** 3);
    const infillFrac = (1 - shellFrac) * (f.infillPct / 100);
    const effCm3     = f.volumeCm3 * (shellFrac + infillFrac);

    const grams      = effCm3 * material.density;
    const flowMm3s   = FLOW_MM3_PER_S * (f.layerHeight / 0.2);
    const hours      = (effCm3 * 1000 / Math.max(2, flowMm3s)) * 1.18 / 3600;

    const materialBasePaise   = Math.round(grams * material.ratePerGram);
    const layerMultiplier     = LAYER_HEIGHT_MULTIPLIER[f.layerHeight] ?? 1.00;
    const materialAfterLayer  = Math.round(materialBasePaise * layerMultiplier);
    const layerUpliftPaise    = materialAfterLayer - materialBasePaise; // signed

    const beforeMulticolor    = materialAfterLayer + finishPerCopy;
    const multicolorUpliftPaise = multicolor ? Math.round(beforeMulticolor * 0.20) : 0;
    const perUnitPaise        = beforeMulticolor + multicolorUpliftPaise;

    const lineGrossPaise      = perUnitPaise * qty;
    const qtyDiscountPaise    = Math.round(lineGrossPaise * (1 - qtyMult));
    const lineSubtotalPaise   = lineGrossPaise - qtyDiscountPaise;

    return {
      name:                  f.filename ?? 'untitled',
      materialSlug:          f.materialSlug,
      materialName:          material.name,
      grams,
      hours,
      materialBasePaise,
      layerHeight:           f.layerHeight,
      layerMultiplier,
      layerUpliftPaise,
      multicolor,
      multicolorUpliftPaise,
      finish,
      finishPaise:           finishPerCopy,
      perUnitPaise,
      quantity:              qty,
      lineGrossPaise,
      qtyDiscountPct,
      qtyDiscountPaise,
      lineSubtotalPaise,
    };
  });

  // Setup is NOT discounted — qty discount applies to per-file material only.
  // Sum the (already-discounted) per-file line subtotals and add the FULL
  // setup. Rush is +25% of (parts + setup); promo is computed against
  // (parts + setup + rush). Min-order floor applied at the very end.
  const setupTotalPaise    = SETUP_PAISE * fileCount;
  const lineSubsSum        = perFile.reduce((s, f) => s + f.lineSubtotalPaise, 0);
  const partsAfterDiscount = lineSubsSum + setupTotalPaise;

  const rushPaise    = rush ? Math.round(partsAfterDiscount * RUSH_FEE_PCT / 100) : 0;
  const partsAndRush = partsAfterDiscount + rushPaise;

  const promo = validatePromoCode(promoCode);
  let promoDiscountPaise = 0;
  let promoLabel = null;
  if (promo) {
    if (promo.type === 'percent') {
      promoDiscountPaise = Math.round(partsAndRush * promo.value / 100);
    } else if (promo.type === 'flat') {
      promoDiscountPaise = Math.min(promo.value, partsAndRush);
    }
    promoLabel = promo.label;
  }
  const subtotalPreFloor   = partsAndRush - promoDiscountPaise;
  const subtotalPaise      = Math.max(subtotalPreFloor, MIN_ORDER_PAISE);
  const minOrderTopUpPaise = subtotalPaise - subtotalPreFloor;

  // Build-envelope check + warnings (per file).
  const warnings = [];
  let fitsBuildVolume = true;
  for (const f of files) {
    const partDims = [f.bbox.x, f.bbox.y, f.bbox.z].sort((a, b) => b - a);
    const envDims  = [BUILD_ENVELOPE_MM.x, BUILD_ENVELOPE_MM.y, BUILD_ENVELOPE_MM.z]
                       .sort((a, b) => b - a);
    if (!partDims.every((d, i) => d <= envDims[i])) {
      fitsBuildVolume = false;
      warnings.push(`${f.filename ?? 'File'} exceeds build envelope`);
    }
    if (f.volumeCm3 < 0.01) {
      warnings.push(`${f.filename ?? 'File'}: volume looks unusually small — check CAD units`);
    }
    if (Math.min(f.bbox.x, f.bbox.y, f.bbox.z) < 1) {
      warnings.push(`${f.filename ?? 'File'}: very small dimension — verify mm vs in`);
    }
  }

  // quantity / finish / multicolor are now per-file (see perFile entries).
  return {
    perFile,
    fileCount,
    rush,
    setupTotalPaise,
    minOrderTopUpPaise,   // 0 if floor not activated
    promoDiscountPaise,   // 0 if no promo
    promoLabel,           // null if no promo
    rushPaise,            // 0 if rush off
    subtotalPaise,        // headline number — GST-inclusive, before shipping
    warnings,
    fitsBuildVolume,
  };
}

// ─────────────────────────────────────────────────────────────────────
// computeCheckout — checkout-stage math.
//
//   quoteSubtotalPaise: subtotalPaise from computeQuote()
//   opts:
//     shippingPaise:   computed from PIN (set 0 before the calculate call)
//     paymentMethod:   'razorpay' | 'upi' | 'neft'   (default 'razorpay')
//     gstinProvided:   boolean — only changes the gstBreakdown disclosure
//
// Returns { shippingPaise, paymentFeePaise, grandTotalPaise,
//           gstBreakdownPaise, gstableBasePaise }
//
// GST is NEVER additive. When gstinProvided, we break out the GST
// already inside grandTotal as round(grandTotal × 18 / 118) so the B2B
// customer sees the taxable base on their invoice.
// ─────────────────────────────────────────────────────────────────────
export function computeCheckout(
  quoteSubtotalPaise,
  { shippingPaise = 0, paymentMethod = 'razorpay', gstinProvided = false } = {}
) {
  const paymentFeePaise = paymentMethod === 'razorpay'
    ? Math.round((quoteSubtotalPaise + shippingPaise) * RAZORPAY_FEE_PCT / 100)
    : 0;
  const grandTotalPaise = quoteSubtotalPaise + shippingPaise + paymentFeePaise;
  const gstBreakdownPaise = gstinProvided
    ? Math.round(grandTotalPaise * GST_PCT / (100 + GST_PCT))
    : 0;
  const gstableBasePaise = gstinProvided
    ? grandTotalPaise - gstBreakdownPaise
    : 0;
  return { shippingPaise, paymentFeePaise, grandTotalPaise, gstBreakdownPaise, gstableBasePaise };
}
