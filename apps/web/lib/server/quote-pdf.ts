import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  quote,
  computeMass,
  formatINR as fmtINR,
  MATERIALS,
  type FileInput,
  type MaterialKey,
  type LayerHeight,
  type Finish,
  type PromoCode,
} from '@printgrid/pricing';
import { analyzeManufacturability } from '../manufacturability';

export interface PdfFileInput {
  filename: string;
  volumeMm3: number;
  bboxSize: [number, number, number];
  triangleCount: number;
  config: { materialKey: MaterialKey; layerHeight: LayerHeight; finish: Finish; multicolor: boolean; qty: number };
}

export interface PdfQuoteInput {
  files: PdfFileInput[];
  rush?: boolean;
  promo?: PromoCode | null;
  addressState?: string | null;
}

type Color = ReturnType<typeof rgb>;
const INK: Color = rgb(0.04, 0.04, 0.04);
const MUTE: Color = rgb(0.4, 0.4, 0.4);
const ACCENT: Color = rgb(0.82, 0.27, 0.13);
const HAIR: Color = rgb(0.85, 0.85, 0.83);

const A4: [number, number] = [595.28, 841.89];

// pdf-lib StandardFonts use WinAnsi, which can't encode ₹ — use "Rs ".
const money = (paise: number): string => fmtINR(paise).replace(/₹/g, 'Rs ');

/**
 * Render an engineering quote PDF from data already computed. No new pricing
 * logic — the breakdown is recomputed via @printgrid/pricing. Returns PDF bytes.
 */
export async function renderQuotePdf(input: PdfQuoteInput, opts: { dateLabel?: string } = {}): Promise<Uint8Array> {
  if (!input.files?.length) throw new Error('At least one file is required for a quote PDF');

  const fileInputs: FileInput[] = input.files.map((f) => ({
    massGrams: computeMass(f.volumeMm3, f.config.materialKey),
    materialKey: f.config.materialKey,
    layerHeight: f.config.layerHeight,
    finish: f.config.finish,
    multicolor: f.config.multicolor,
    qty: f.config.qty,
  }));
  const q = quote({ files: fileInputs, rush: !!input.rush, promo: input.promo ?? null, addressState: input.addressState ?? null });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const M = 48;
  const W = A4[0] - M * 2;
  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - M;

  const ensure = (need: number) => {
    if (y - need < M) {
      page = doc.addPage(A4);
      y = A4[1] - M;
    }
  };
  const line = (text: string, o: { size?: number; f?: PDFFont; color?: Color; x?: number; gap?: number } = {}) => {
    const size = o.size ?? 10;
    const gap = o.gap ?? 4;
    ensure(size + gap);
    page.drawText(text, { x: o.x ?? M, y, size, font: o.f ?? font, color: o.color ?? INK });
    y -= size + gap;
  };
  const row = (label: string, value: string, isBold = false) => {
    const size = 10;
    ensure(size + 4);
    const f = isBold ? bold : font;
    page.drawText(label, { x: M, y, size, font: isBold ? bold : font, color: isBold ? INK : MUTE });
    const vw = f.widthOfTextAtSize(value, size);
    page.drawText(value, { x: M + W - vw, y, size, font: f, color: INK });
    y -= size + 4;
  };
  const rule = () => {
    ensure(10);
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.5, color: HAIR });
    y -= 10;
  };

  line('PrintGrid Studio', { size: 18, f: bold, gap: 2 });
  line('Engineering quote', { size: 11, f: bold, color: ACCENT, gap: 2 });
  line(`FDM 3D printing · Chennai · printgrid.co.in${opts.dateLabel ? '  ·  ' + opts.dateLabel : ''}`, { size: 9, color: MUTE, gap: 10 });
  rule();

  input.files.forEach((f, i) => {
    const m = MATERIALS[f.config.materialKey];
    const mass = fileInputs[i]!.massGrams;
    line(`${i + 1}. ${f.filename}`, { size: 12, f: bold, gap: 4 });
    row('Material', `${m.name} · ${money(m.ratePerGramPaise)}/g`);
    row('Layer / finish', `${f.config.layerHeight} mm · ${f.config.finish}${f.config.multicolor ? ' · multicolour' : ''}`);
    row('Quantity', String(f.config.qty));
    row('Volume', `${(f.volumeMm3 / 1000).toFixed(2)} cm³`);
    row('Bounding box', `${f.bboxSize.map((d) => d.toFixed(1)).join(' × ')} mm`);
    row('Est. printed mass', `${mass.toFixed(1)} g`);
    row('Triangles', f.triangleCount.toLocaleString());
    row('Material specs', `${m.density} g/cm³ · ${m.tensileMpa} MPa · ${m.maxTempC} °C`);
    const warns = analyzeManufacturability({ volumeMm3: f.volumeMm3, bboxSize: f.bboxSize, triangleCount: f.triangleCount });
    for (const w of warns) line(`! ${w.message}`, { size: 9, color: w.severity === 'info' ? MUTE : ACCENT, gap: 3 });
    y -= 6;
    rule();
  });

  line('Quote', { size: 12, f: bold, gap: 6 });
  row('Subtotal', money(q.subtotalPaise));
  if (q.rushFeePaise > 0) row('Rush (+25%)', money(q.rushFeePaise));
  if (q.promoDiscountPaise > 0) row(`Promo ${q.appliedPromo}`, '-' + money(q.promoDiscountPaise));
  row('Shipping', q.shippingPaise === 0 ? 'Free' : money(q.shippingPaise));
  row('GST (18%)', money(q.gstTotalPaise));
  row('Payment processing (2%)', money(q.paymentFeePaise));
  y -= 2;
  rule();
  row('Total (incl. GST)', money(q.grandTotalPaise), true);
  y -= 8;
  line('Lead time: 3–5 working days after payment clears, plus 1–6 days transit (pan-India).', { size: 9, color: MUTE });
  line('Quote valid 7 days. The charged amount is recomputed server-side from the actual mesh at checkout.', { size: 8, color: MUTE });

  return doc.save();
}
