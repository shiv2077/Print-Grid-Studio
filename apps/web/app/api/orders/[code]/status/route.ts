import { handleStatusUpdate } from '@/lib/server/fulfillment';
import { findOrderIdByCode, appendStatusHistory, setFulfillmentStatus } from '@/lib/server/orders';

export const runtime = 'nodejs';

/**
 * POST /api/orders/[code]/status — minimal protected status update.
 * Auth: `x-admin-secret` header must equal ADMIN_STATUS_SECRET. If that env var
 * is unset the endpoint returns 503 (not configured). NOT a full auth system.
 * Body: { status: FulfillmentStatus, note?: string }.
 */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const secret = req.headers.get('x-admin-secret');
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const outcome = await handleStatusUpdate(params.code.toUpperCase(), secret, body as any, {
    adminSecret: process.env.ADMIN_STATUS_SECRET,
    findOrderIdByCode,
    appendHistory: appendStatusHistory,
    setStatus: setFulfillmentStatus,
  });
  return Response.json(
    outcome.ok ? { status: outcome.message } : { error: outcome.message },
    { status: outcome.status },
  );
}
