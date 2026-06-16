import {
  quote,
  computeMass,
  type FileInput,
  type MaterialKey,
  type LayerHeight,
  type Finish,
  type PromoCode,
} from '@printgrid/pricing';
import { meshVolumeMm3 } from './mesh-volume';
import { uploadModel } from './storage';
import { createRazorpayOrder, razorpayKeyId } from './razorpay';
import { createOrder, addOrderFile, genOrderCode } from './orders';

export interface FileConfig {
  materialKey: MaterialKey;
  layerHeight: LayerHeight;
  finish: Finish;
  multicolor: boolean;
  qty: number;
}

export interface IncomingFile {
  buffer: Buffer;
  filename: string;
  config: FileConfig;
}

export interface CreateOptions {
  rush?: boolean;
  promo?: PromoCode | null;
  addressState?: string | null;
  email?: string | null;
}

export interface CreateOrderResult {
  order_code: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
  key_id: string;
}

function sanitizeFilename(name: string): string {
  return (name || 'model').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

/**
 * Creates a single order from one or more uploaded models. The charged amount
 * is ALWAYS computed here from the SERVER's own volume measurement of every
 * file via @printgrid/pricing — the client cannot send or influence the price.
 */
export async function createOrderFromFiles(files: IncomingFile[], opts: CreateOptions): Promise<CreateOrderResult> {
  if (!files.length) throw new Error('At least one file is required');

  // 1. Measure every file server-side (STL / OBJ / 3MF).
  const measured = await Promise.all(
    files.map(async (f) => {
      const volumeMm3 = (await meshVolumeMm3(f.buffer, f.filename)).volumeMm3;
      const massGrams = computeMass(volumeMm3, f.config.materialKey);
      return { ...f, volumeMm3, massGrams };
    }),
  );

  // 2. Price all files together from the server measurements.
  const fileInputs: FileInput[] = measured.map((m) => ({
    massGrams: m.massGrams,
    materialKey: m.config.materialKey,
    layerHeight: m.config.layerHeight,
    finish: m.config.finish,
    multicolor: m.config.multicolor,
    qty: m.config.qty,
  }));
  const q = quote({ files: fileInputs, rush: !!opts.rush, promo: opts.promo ?? null, addressState: opts.addressState ?? null });

  const orderCode = genOrderCode();
  const totalVolume = measured.reduce((s, m) => s + m.volumeMm3, 0);

  // 3. Razorpay order for the SERVER amount.
  const rzp = await createRazorpayOrder(q.grandTotalPaise, orderCode);

  // 4. Persist the order, then upload each file + its row.
  const order = await createOrder({
    orderCode,
    status: 'pending',
    amountPaise: q.grandTotalPaise,
    currency: 'INR',
    serverVolumeMm3: totalVolume,
    email: opts.email ?? null,
    razorpayOrderId: rzp.id,
  });

  for (const m of measured) {
    const safe = sanitizeFilename(m.filename);
    const path = `${orderCode}/${safe}`;
    await uploadModel(path, m.buffer);
    await addOrderFile({
      orderId: order.id,
      storagePath: path,
      filename: safe,
      materialKey: m.config.materialKey,
      layerHeight: m.config.layerHeight,
      finish: m.config.finish,
      multicolor: m.config.multicolor,
      qty: m.config.qty,
      volumeMm3: m.volumeMm3,
      massGrams: m.massGrams,
    });
  }

  return {
    order_code: orderCode,
    razorpay_order_id: rzp.id,
    amount_paise: q.grandTotalPaise,
    currency: 'INR',
    key_id: razorpayKeyId(),
  };
}
