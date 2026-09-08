// Real PrintGrid content for the v2 homepage. No invented numbers — every value
// traces to @printgrid/pricing, lib/manufacturability, or the live site copy.
import { MATERIAL_TABLE } from '@/lib/materials-data';

export const NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#materials', label: 'Materials' },
  { href: '#specs', label: 'Specs' },
] as const;

export const HERO_SPECS = [
  { value: '256', unit: 'mm', label: 'build envelope' },
  { value: '±0.15', unit: 'mm', label: 'tolerance' },
  { value: '7', unit: '', label: 'materials' },
  { value: '4', unit: 'day', label: 'pan-India ship' },
] as const;

export const STATS = [
  { tag: 'Build volume', num: '256', unit: 'mm³', label: 'Bambu P1S usable bed — one of the largest in its class.' },
  { tag: 'Tolerance', num: '±0.15', unit: 'mm', label: 'Dimensional accuracy on calibrated FDM machines.' },
  { tag: 'Materials', num: '7', unit: '', label: 'PLA+, PLA-LW, PETG, ABS, TPU 95A, PA6, PA-CF.' },
  { tag: 'Turnaround', num: '4', unit: 'days', label: 'Printed in Chennai, shipped pan-India with tracking.' },
] as const;

export const FLOW = [
  { n: '01', t: 'Upload', d: 'Drop an STL, OBJ, or 3MF. We measure its true volume — not a bounding-box guess.' },
  { n: '02', t: 'Instant quote', d: 'Price computed from the actual mesh, incl. 18% GST and the payment fee. No “contact us”.' },
  { n: '03', t: 'Pay', d: 'Checkout over UPI through Razorpay. We never see your card or UPI credentials.' },
  { n: '04', t: 'Print', d: 'Printed on calibrated machines in Chennai, in the material and finish you chose.' },
  { n: '05', t: 'Ship', d: 'Dispatched pan-India in four days through registered couriers, tracked end to end.' },
] as const;

export type BarMetric = 'tensile' | 'temp' | 'cost';
export const BAR_METRICS: { key: BarMetric; label: string; unit: string; get: (m: typeof MATERIAL_TABLE[number]) => number }[] = [
  { key: 'tensile', label: 'Strength', unit: 'MPa', get: (m) => m.tensileMpa },
  { key: 'temp', label: 'Heat resist', unit: '°C', get: (m) => m.maxTempC },
  { key: 'cost', label: 'Cost', unit: '₹/g', get: (m) => Math.round(m.ratePerGramPaise / 100) },
];
export const MATERIALS = MATERIAL_TABLE;

export const FOOTER_COLS = [
  { h: 'Product', links: [
    { href: '/quote', label: 'Get a quote' },
    { href: '/materials', label: 'Materials' },
    { href: '/#pricing', label: 'Pricing' },
  ] },
  { h: 'Company', links: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/shipping', label: 'Shipping' },
  ] },
  { h: 'Legal', links: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/refund', label: 'Refund' },
  ] },
] as const;

export const TRUST_BADGES = ['Razorpay-secured', 'UPI payments', 'GST-registered'] as const;

export const WHATSAPP = '+91 75400 23670';
