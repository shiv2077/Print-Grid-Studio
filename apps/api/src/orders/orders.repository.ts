import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { orders, orderFiles, type NewOrder, type NewOrderFile, type OrderRow } from '../db/schema';

@Injectable()
export class OrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createOrder(data: NewOrder): Promise<OrderRow> {
    const [row] = await this.db.insert(orders).values(data).returning();
    return row;
  }

  async addFile(data: NewOrderFile) {
    const [row] = await this.db.insert(orderFiles).values(data).returning();
    return row;
  }

  async findByCode(orderCode: string): Promise<OrderRow | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.orderCode, orderCode)).limit(1);
    return row ?? null;
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<OrderRow | null> {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, razorpayOrderId))
      .limit(1);
    return row ?? null;
  }

  /**
   * Idempotent paid transition (M2.5): flips a row to `paid` ONLY if it is
   * currently `pending`. A second delivery of the same event matches zero rows
   * and returns null, so it never double-processes.
   */
  async markPaidIfPending(razorpayOrderId: string, razorpayPaymentId: string): Promise<OrderRow | null> {
    const [row] = await this.db
      .update(orders)
      .set({ status: 'paid', razorpayPaymentId, updatedAt: new Date() })
      .where(and(eq(orders.razorpayOrderId, razorpayOrderId), eq(orders.status, 'pending')))
      .returning();
    return row ?? null;
  }
}
