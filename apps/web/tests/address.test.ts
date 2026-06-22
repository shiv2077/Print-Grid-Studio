import { describe, expect, it } from 'vitest';
import { validateAddress } from '../lib/address';

const VALID = {
  name: 'Asha R',
  phone: '9876543210',
  email: 'a@b.com',
  line1: '12 Main St',
  line2: '',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600040',
};

describe('validateAddress', () => {
  it('accepts a complete valid address', () => {
    const r = validateAddress(VALID);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('requires name, line1, city, state', () => {
    const r = validateAddress({ ...VALID, name: '', line1: '', city: '', state: '' });
    expect(r.ok).toBe(false);
    expect(r.fieldErrors.name).toBeDefined();
    expect(r.fieldErrors.line1).toBeDefined();
    expect(r.fieldErrors.city).toBeDefined();
    expect(r.fieldErrors.state).toBeDefined();
  });

  it('rejects a PIN that is not exactly 6 digits', () => {
    expect(validateAddress({ ...VALID, pincode: '12345' }).fieldErrors.pincode).toBeDefined();
    expect(validateAddress({ ...VALID, pincode: '7000401' }).fieldErrors.pincode).toBeDefined();
    expect(validateAddress({ ...VALID, pincode: 'abcdef' }).fieldErrors.pincode).toBeDefined();
    expect(validateAddress({ ...VALID, pincode: '600040' }).fieldErrors.pincode).toBeUndefined();
  });

  it('validates Indian mobile numbers (10 digits, starts 6-9, optional +91)', () => {
    expect(validateAddress({ ...VALID, phone: '9876543210' }).fieldErrors.phone).toBeUndefined();
    expect(validateAddress({ ...VALID, phone: '+919876543210' }).fieldErrors.phone).toBeUndefined();
    expect(validateAddress({ ...VALID, phone: '98765 43210' }).fieldErrors.phone).toBeUndefined();
    expect(validateAddress({ ...VALID, phone: '12345' }).fieldErrors.phone).toBeDefined();
    expect(validateAddress({ ...VALID, phone: '1234567890' }).fieldErrors.phone).toBeDefined(); // starts with 1
    expect(validateAddress({ ...VALID, phone: '' }).fieldErrors.phone).toBeDefined();
  });

  it('treats email as optional but validates it when present', () => {
    expect(validateAddress({ ...VALID, email: '' }).ok).toBe(true);
    expect(validateAddress({ ...VALID, email: undefined }).ok).toBe(true);
    expect(validateAddress({ ...VALID, email: 'notanemail' }).fieldErrors.email).toBeDefined();
  });
});
