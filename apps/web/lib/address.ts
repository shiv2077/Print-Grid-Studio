// Shipping address — shared validator used by the checkout form (client) and the
// /api/orders route (server). Pure, no deps.

export interface ShippingAddress {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type AddressField = keyof ShippingAddress;

export interface AddressValidation {
  ok: boolean;
  errors: string[];
  fieldErrors: Partial<Record<AddressField, string>>;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Indian mobile: 10 digits starting 6-9, optional +91 / 91 prefix.
const PHONE_RE = /^(?:\+?91)?[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;

export function validateAddress(a: Partial<ShippingAddress> | undefined): AddressValidation {
  const fe: Partial<Record<AddressField, string>> = {};
  const addr = a ?? {};
  const req = (k: AddressField, label: string) => {
    if (!addr[k] || !String(addr[k]).trim()) fe[k] = `${label} is required`;
  };

  req('name', 'Name');
  req('line1', 'Address line 1');
  req('city', 'City');
  req('state', 'State');

  const phone = (addr.phone ?? '').replace(/[\s-]/g, '');
  if (!phone) fe.phone = 'Phone is required';
  else if (!PHONE_RE.test(phone)) fe.phone = 'Enter a valid 10-digit Indian mobile number';

  const pin = (addr.pincode ?? '').trim();
  if (!pin) fe.pincode = 'PIN code is required';
  else if (!PIN_RE.test(pin)) fe.pincode = 'PIN code must be 6 digits';

  if (addr.email && !EMAIL_RE.test(addr.email.trim())) fe.email = 'Enter a valid email';

  const errors = Object.values(fe);
  return { ok: errors.length === 0, errors, fieldErrors: fe };
}
