import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

// All money is INTEGER PAISE. Mirrors supabase/migrations/0001_init.sql.

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderCode: text('order_code').notNull().unique(),
    status: text('status').notNull().default('pending'),
    amountPaise: integer('amount_paise').notNull(),
    currency: text('currency').notNull().default('INR'),
    serverVolumeMm3: doublePrecision('server_volume_mm3'),
    email: text('email'),
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

export type OrderRow = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderFileRow = typeof orderFiles.$inferSelect;
export type NewOrderFile = typeof orderFiles.$inferInsert;
