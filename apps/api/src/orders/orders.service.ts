import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  quote,
  computeMass,
  type FileInput,
  type MaterialKey,
  type LayerHeight,
  type Finish,
  type PromoCode,
} from '@printgrid/pricing';
import { stlVolumeMm3 } from '../stl/stl-volume';
import { OrdersRepository } from './orders.repository';
import { RazorpayService } from '../razorpay/razorpay.service';
import { StorageService } from '../storage/storage.service';

export interface CreateOrderParams {
  materialKey: MaterialKey;
  layerHeight: LayerHeight;
  finish: Finish;
  multicolor: boolean;
  qty: number;
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

function genOrderCode(): string {
  return `PG-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function sanitizeFilename(name: string): string {
  return (name || 'model.stl').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly razorpay: RazorpayService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Creates an order from an uploaded STL. The charged amount is ALWAYS computed
   * here from the SERVER's own volume measurement via @printgrid/pricing — the
   * client cannot send or influence the price.
   */
  async createFromStl(
    fileBuffer: Buffer,
    originalName: string,
    p: CreateOrderParams,
  ): Promise<CreateOrderResult> {
    // 1. Measure volume server-side (throws on a non-closed / empty mesh).
    let volumeMm3: number;
    try {
      volumeMm3 = stlVolumeMm3(fileBuffer).volumeMm3;
    } catch (err) {
      throw new BadRequestException(`STL error: ${(err as Error).message}`);
    }

    // 2. Price from the SERVER measurement. Pricing validates material/layer/etc.
    let massGrams: number;
    let grandTotalPaise: number;
    try {
      massGrams = computeMass(volumeMm3, p.materialKey);
      const file: FileInput = {
        massGrams,
        materialKey: p.materialKey,
        layerHeight: p.layerHeight,
        finish: p.finish,
        multicolor: !!p.multicolor,
        qty: Number(p.qty),
      };
      grandTotalPaise = quote({
        files: [file],
        rush: !!p.rush,
        promo: p.promo ?? null,
        addressState: p.addressState ?? null,
      }).grandTotalPaise;
    } catch (err) {
      throw new BadRequestException(`Pricing error: ${(err as Error).message}`);
    }

    const orderCode = genOrderCode();

    // 3. Store the STL in the private bucket.
    const storagePath = `${orderCode}/${sanitizeFilename(originalName)}`;
    await this.storage.uploadStl(storagePath, fileBuffer);

    // 4. Create the Razorpay order for the SERVER amount.
    const rzpOrder = await this.razorpay.createOrder(grandTotalPaise, orderCode);

    // 5. Persist: orders (pending) + order_files.
    const order = await this.repo.createOrder({
      orderCode,
      status: 'pending',
      amountPaise: grandTotalPaise,
      currency: 'INR',
      serverVolumeMm3: volumeMm3,
      email: p.email ?? null,
      razorpayOrderId: rzpOrder.id,
    });
    await this.repo.addFile({
      orderId: order.id,
      storagePath,
      filename: sanitizeFilename(originalName),
      materialKey: p.materialKey,
      layerHeight: p.layerHeight,
      finish: p.finish,
      multicolor: !!p.multicolor,
      qty: Number(p.qty),
      volumeMm3,
      massGrams,
    });

    // 6. Return only what the browser needs — never an amount it could trust blindly.
    return {
      order_code: orderCode,
      razorpay_order_id: rzpOrder.id,
      amount_paise: grandTotalPaise,
      currency: 'INR',
      key_id: this.razorpay.publicKeyId,
    };
  }

  async getPublicStatus(orderCode: string) {
    const row = await this.repo.findByCode(orderCode);
    if (!row) return null;
    return {
      order_code: row.orderCode,
      status: row.status,
      amount_paise: row.amountPaise,
      currency: row.currency,
    };
  }
}
