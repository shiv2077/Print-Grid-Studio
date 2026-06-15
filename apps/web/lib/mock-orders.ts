// Mock order data for /orders/[code]. Backend phase replaces this
// with real Prisma queries. The shape is intentionally a superset of
// what we'll persist so swapping is mostly a name change.

import type { MaterialKey, LayerHeight, Finish } from '@printgrid/pricing';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PRINTING'
  | 'QUALITY_CHECK'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  fileName: string;
  materialKey: MaterialKey;
  layerHeight: LayerHeight;
  finish: Finish;
  multicolor: boolean;
  qty: number;
  massGrams: number;
  lineSubtotalPaise: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  at: string; // ISO date
  note?: string;
}

export interface OrderAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface MockOrder {
  code: string;
  status: OrderStatus;
  placedAt: string; // ISO date
  customerEmail: string;
  items: OrderItem[];
  partsSubtotalPaise: number;
  setupTotalPaise: number;
  rushFeePaise: number;
  promoDiscountPaise: number;
  appliedPromo: string | null;
  shippingPaise: number;
  paymentFeePaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  address: OrderAddress;
  events: OrderTimelineEvent[];
  trackingNumber?: string;
  courier?: string;
}

export const ORDER_CODE_REGEX = /^PG-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const ORDERS: ReadonlyArray<MockOrder> = [
  {
    code: 'PG-DEMO-0001',
    status: 'DELIVERED',
    placedAt: '2026-04-12T10:30:00+05:30',
    customerEmail: 'priya.s@example.com',
    items: [
      {
        fileName: 'drone-arm-v3.stl',
        materialKey: 'pa-cf',
        layerHeight: '0.20',
        finish: 'as-printed',
        multicolor: false,
        qty: 4,
        massGrams: 38.4,
        lineSubtotalPaise: 322560, // 4 × 80640
      },
    ],
    partsSubtotalPaise: 322560,
    setupTotalPaise: 10000,
    rushFeePaise: 0,
    promoDiscountPaise: 33256,
    appliedPromo: 'DRONE25',
    shippingPaise: 0,
    paymentFeePaise: 5986,
    taxPaise: 45656,
    grandTotalPaise: 351290,
    address: {
      name: 'Priya Sundaram',
      line1: '14B, 2nd Cross, RMV Stage 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560094',
      phone: '+91 98450 12345',
    },
    events: [
      { status: 'PENDING', at: '2026-04-12T10:30:00+05:30', note: 'Quote created' },
      { status: 'PAID', at: '2026-04-12T10:42:00+05:30' },
      { status: 'PRINTING', at: '2026-04-12T16:00:00+05:30', note: 'Printer 1' },
      { status: 'QUALITY_CHECK', at: '2026-04-13T14:20:00+05:30' },
      { status: 'SHIPPED', at: '2026-04-13T18:05:00+05:30', note: 'Delhivery · 3GH4K9' },
      { status: 'DELIVERED', at: '2026-04-15T11:40:00+05:30' },
    ],
    trackingNumber: '3GH4K9P0',
    courier: 'Delhivery',
  },
  {
    code: 'PG-DEMO-0002',
    status: 'SHIPPED',
    placedAt: '2026-05-06T15:12:00+05:30',
    customerEmail: 'rahul.kumar@example.com',
    items: [
      {
        fileName: 'enclosure-bottom.stl',
        materialKey: 'petg',
        layerHeight: '0.20',
        finish: 'sanded',
        multicolor: false,
        qty: 2,
        massGrams: 124.5,
        lineSubtotalPaise: 164400,
      },
      {
        fileName: 'enclosure-lid.stl',
        materialKey: 'petg',
        layerHeight: '0.20',
        finish: 'sanded',
        multicolor: false,
        qty: 2,
        massGrams: 78.2,
        lineSubtotalPaise: 108840,
      },
    ],
    partsSubtotalPaise: 273240,
    setupTotalPaise: 20000,
    rushFeePaise: 0,
    promoDiscountPaise: 0,
    appliedPromo: null,
    shippingPaise: 0,
    paymentFeePaise: 5865,
    taxPaise: 45614,
    grandTotalPaise: 299105,
    address: {
      name: 'Rahul Kumar',
      line1: 'Flat 304, Brigade Cosmopolis',
      line2: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      phone: '+91 98860 33221',
    },
    events: [
      { status: 'PENDING', at: '2026-05-06T15:12:00+05:30' },
      { status: 'PAID', at: '2026-05-06T15:18:00+05:30' },
      { status: 'PRINTING', at: '2026-05-06T18:30:00+05:30', note: 'Printer 2' },
      { status: 'QUALITY_CHECK', at: '2026-05-07T22:10:00+05:30' },
      { status: 'SHIPPED', at: '2026-05-08T10:50:00+05:30', note: 'Bluedart · BLU2261A' },
    ],
    trackingNumber: 'BLU2261A',
    courier: 'Bluedart',
  },
  {
    code: 'PG-DEMO-0003',
    status: 'PRINTING',
    placedAt: '2026-05-08T22:48:00+05:30',
    customerEmail: 'aisha.k@example.com',
    items: [
      {
        fileName: 'gripper-jaw.stl',
        materialKey: 'tpu-95a',
        layerHeight: '0.16',
        finish: 'as-printed',
        multicolor: false,
        qty: 6,
        massGrams: 18.7,
        lineSubtotalPaise: 142220,
      },
    ],
    partsSubtotalPaise: 142220,
    setupTotalPaise: 10000,
    rushFeePaise: 38055,
    promoDiscountPaise: 0,
    appliedPromo: null,
    shippingPaise: 12000,
    paymentFeePaise: 4046,
    taxPaise: 31597,
    grandTotalPaise: 206321,
    address: {
      name: 'Aisha K',
      line1: 'No 27, Sterling Avenue',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600028',
      phone: '+91 90080 12121',
    },
    events: [
      { status: 'PENDING', at: '2026-05-08T22:48:00+05:30' },
      { status: 'PAID', at: '2026-05-08T22:51:00+05:30' },
      { status: 'PRINTING', at: '2026-05-09T08:15:00+05:30', note: 'Printer 1 · rush queue' },
    ],
  },
  {
    code: 'PG-DEMO-0004',
    status: 'PAID',
    placedAt: '2026-05-09T06:42:00+05:30',
    customerEmail: 'aarav@example.com',
    items: [
      {
        fileName: 'logo-keychain.stl',
        materialKey: 'pla-plus',
        layerHeight: '0.20',
        finish: 'gloss',
        multicolor: true,
        qty: 25,
        massGrams: 6.4,
        lineSubtotalPaise: 154200,
      },
    ],
    partsSubtotalPaise: 154200,
    setupTotalPaise: 10000,
    rushFeePaise: 0,
    promoDiscountPaise: 16420,
    appliedPromo: 'FIRSTPRINT',
    shippingPaise: 0,
    paymentFeePaise: 2956,
    taxPaise: 23010,
    grandTotalPaise: 173746,
    address: {
      name: 'Aarav Reddy',
      line1: '12-2-417/B, Mehdipatnam',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500028',
      phone: '+91 91212 88800',
    },
    events: [
      { status: 'PENDING', at: '2026-05-09T06:42:00+05:30' },
      { status: 'PAID', at: '2026-05-09T06:50:00+05:30' },
    ],
  },
  {
    code: 'PG-DEMO-0005',
    status: 'CANCELLED',
    placedAt: '2026-05-02T19:00:00+05:30',
    customerEmail: 'kavya@example.com',
    items: [
      {
        fileName: 'lampshade-prototype.stl',
        materialKey: 'pla-plus',
        layerHeight: '0.24',
        finish: 'as-printed',
        multicolor: false,
        qty: 1,
        massGrams: 200,
        lineSubtotalPaise: 90000,
      },
    ],
    partsSubtotalPaise: 90000,
    setupTotalPaise: 10000,
    rushFeePaise: 0,
    promoDiscountPaise: 0,
    appliedPromo: null,
    shippingPaise: 12000,
    paymentFeePaise: 2240,
    taxPaise: 17486,
    grandTotalPaise: 114240,
    address: {
      name: 'Kavya Iyer',
      line1: '88, MG Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      phone: '+91 95277 66554',
    },
    events: [
      { status: 'PENDING', at: '2026-05-02T19:00:00+05:30' },
      { status: 'PAID', at: '2026-05-02T19:08:00+05:30' },
      { status: 'CANCELLED', at: '2026-05-03T10:15:00+05:30', note: 'Customer requested cancellation · refund processed' },
    ],
  },
];

export function getMockOrder(code: string): MockOrder | null {
  if (!ORDER_CODE_REGEX.test(code)) return null;
  return ORDERS.find((o) => o.code === code) ?? null;
}

export const MOCK_ORDER_CODES: ReadonlyArray<string> = ORDERS.map((o) => o.code);
