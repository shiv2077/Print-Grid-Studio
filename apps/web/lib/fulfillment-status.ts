// Client-safe fulfillment status constants (no server/node deps).
export const FULFILLMENT_STATUSES = [
  'uploaded', 'under_review', 'approved', 'printing',
  'post_processing', 'quality_check', 'packed', 'shipped', 'delivered',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

const STATUS_SET: ReadonlySet<string> = new Set(FULFILLMENT_STATUSES);

export function isFulfillmentStatus(s: unknown): s is FulfillmentStatus {
  return typeof s === 'string' && STATUS_SET.has(s);
}

export const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  uploaded: 'Uploaded',
  under_review: 'Under review',
  approved: 'Approved',
  printing: 'Printing',
  post_processing: 'Post-processing',
  quality_check: 'Quality check',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};
