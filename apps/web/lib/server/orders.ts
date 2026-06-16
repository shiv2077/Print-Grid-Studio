import { randomBytes } from 'node:crypto';
import { and, eq, asc } from 'drizzle-orm';
import { getDb } from './db';
import {
  orders,
  orderFiles,
  orderStatusHistory,
  type NewOrder,
  type NewOrderFile,
  type OrderRow,
  type OrderStatusHistoryRow,
} from './schema';
import type { FulfillmentStatus } from './fulfillment';

export function genOrderCode(): string {
  return `PG-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createOrder(data: NewOrder): Promise<OrderRow> {
  const [row] = await getDb().insert(orders).values(data).returning();
  if (!row) throw new Error('Failed to insert order');
  return row;
}

export async function addOrderFile(data: NewOrderFile) {
  const [row] = await getDb().insert(orderFiles).values(data).returning();
  if (!row) throw new Error('Failed to insert order file');
  return row;
}

export async function findOrderByCode(code: string): Promise<OrderRow | null> {
  const [row] = await getDb().select().from(orders).where(eq(orders.orderCode, code)).limit(1);
  return row ?? null;
}

export async function findOrderByRazorpayId(razorpayOrderId: string): Promise<OrderRow | null> {
  const [row] = await getDb().select().from(orders).where(eq(orders.razorpayOrderId, razorpayOrderId)).limit(1);
  return row ?? null;
}

export async function filesForOrder(orderId: string) {
  return getDb().select().from(orderFiles).where(eq(orderFiles.orderId, orderId));
}

// ─── Fulfillment timeline (Phase 1) ───────────────────────────────────────────

export async function findOrderIdByCode(code: string): Promise<string | null> {
  const [row] = await getDb().select({ id: orders.id }).from(orders).where(eq(orders.orderCode, code)).limit(1);
  return row?.id ?? null;
}

export async function appendStatusHistory(orderId: string, status: FulfillmentStatus, note: string | null) {
  await getDb().insert(orderStatusHistory).values({ orderId, status, note });
}

export async function setFulfillmentStatus(orderId: string, status: FulfillmentStatus) {
  await getDb().update(orders).set({ fulfillmentStatus: status, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

export async function getStatusHistory(orderId: string): Promise<OrderStatusHistoryRow[]> {
  return getDb()
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(asc(orderStatusHistory.createdAt));
}

/** Idempotent: flips pending -> paid only once; returns null on a replay. */
export async function markPaidIfPending(razorpayOrderId: string, razorpayPaymentId: string): Promise<OrderRow | null> {
  const [row] = await getDb()
    .update(orders)
    .set({ status: 'paid', razorpayPaymentId, updatedAt: new Date() })
    .where(and(eq(orders.razorpayOrderId, razorpayOrderId), eq(orders.status, 'pending')))
    .returning();
  return row ?? null;
}
