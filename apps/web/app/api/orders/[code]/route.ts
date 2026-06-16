import { findOrderByCode, getStatusHistory } from '@/lib/server/orders';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const row = await findOrderByCode(params.code.toUpperCase());
  if (!row) return Response.json({ error: 'Order not found' }, { status: 404 });
  const history = await getStatusHistory(row.id);
  return Response.json({
    order_code: row.orderCode,
    status: row.status,
    amount_paise: row.amountPaise,
    currency: row.currency,
    fulfillment_status: row.fulfillmentStatus,
    created_at: row.createdAt,
    history: history.map((h) => ({ status: h.status, note: h.note, at: h.createdAt })),
  });
}
