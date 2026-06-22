import { timingSafeEqual } from 'node:crypto';
import { isFulfillmentStatus, type FulfillmentStatus } from '../fulfillment-status';

export { FULFILLMENT_STATUSES, STATUS_LABELS, isFulfillmentStatus, type FulfillmentStatus } from '../fulfillment-status';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export interface StatusUpdateInput {
  status?: unknown;
  note?: unknown;
}

export interface StatusUpdateDeps {
  adminSecret: string | undefined;
  findOrderIdByCode: (code: string) => Promise<string | null>;
  appendHistory: (orderId: string, status: FulfillmentStatus, note: string | null) => Promise<void>;
  setStatus: (orderId: string, status: FulfillmentStatus) => Promise<void>;
}

export interface StatusOutcome {
  ok: boolean;
  status: number;
  message: string;
}

/**
 * Minimal protected status update. NOT a full auth system — a single shared
 * admin secret. Returns 503 cleanly if the secret isn't configured. Pure logic
 * with injected deps so it's unit-testable without a DB.
 */
export async function handleStatusUpdate(
  code: string,
  providedSecret: string | null,
  body: StatusUpdateInput,
  deps: StatusUpdateDeps,
): Promise<StatusOutcome> {
  if (!deps.adminSecret) {
    return { ok: false, status: 503, message: 'status updates are not configured' };
  }
  if (!providedSecret || !safeEqual(providedSecret, deps.adminSecret)) {
    return { ok: false, status: 401, message: 'unauthorized' };
  }
  if (!isFulfillmentStatus(body?.status)) {
    return { ok: false, status: 400, message: 'invalid status' };
  }
  const orderId = await deps.findOrderIdByCode(code);
  if (!orderId) return { ok: false, status: 404, message: 'order not found' };

  const note = typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500) : null;
  await deps.appendHistory(orderId, body.status, note);
  await deps.setStatus(orderId, body.status);
  return { ok: true, status: 200, message: body.status };
}
