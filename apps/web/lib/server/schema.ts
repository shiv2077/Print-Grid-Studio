import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

// All money is INTEGER PAISE. Mirrors supabase/migrations/0001_init.sql.

// Fulfillment timeline status (separate from the payment `status`). See 0003.
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'uploaded', 'under_review', 'approved', 'printing',
  'post_processing', 'quality_check', 'packed', 'shipped', 'delivered',
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderCode: text('order_code').notNull().unique(),
    status: text('status').notNull().default('pending'),
    amountPaise: integer('amount_paise').notNull(),
    currency: text('currency').notNull().default('INR'),
    serverVolumeMm3: doublePrecision('server_volume_mm3'),
    fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').notNull().default('uploaded'),
    email: text('email'),
    shipName: text('ship_name'),
    shipPhone: text('ship_phone'),
    shipLine1: text('ship_line1'),
    shipLine2: text('ship_line2'),
    shipCity: text('ship_city'),
    shipState: text('ship_state'),
    shipPincode: text('ship_pincode'),
    razorpayOrderId: text('razorpay_order_id').unique(),
    razorpayPaymentId: text('razorpay_payment_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status),
    rzpOrderIdx: index('orders_razorpay_order_id_idx').on(t.razorpayOrderId),
  }),
);

export const orderFiles = pgTable(
  'order_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    filename: text('filename'),
    materialKey: text('material_key'),
    layerHeight: text('layer_height'),
    finish: text('finish'),
    multicolor: boolean('multicolor').notNull().default(false),
    qty: integer('qty').notNull().default(1),
    volumeMm3: doublePrecision('volume_mm3'),
    massGrams: doublePrecision('mass_grams'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index('order_files_order_id_idx').on(t.orderId),
  }),
);

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: fulfillmentStatusEnum('status').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index('order_status_history_order_id_idx').on(t.orderId),
  }),
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderFileRow = typeof orderFiles.$inferSelect;
export type NewOrderFile = typeof orderFiles.$inferInsert;
export type OrderStatusHistoryRow = typeof orderStatusHistory.$inferSelect;

