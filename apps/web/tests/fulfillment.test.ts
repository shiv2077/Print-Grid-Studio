import { describe, expect, it } from 'vitest';
import { handleStatusUpdate, isFulfillmentStatus, type StatusUpdateDeps } from '../lib/server/fulfillment';

function makeDeps(overrides: Partial<StatusUpdateDeps> = {}) {
  const appended: { id: string; status: string; note: string | null }[] = [];
  const set: { id: string; status: string }[] = [];
  const deps: StatusUpdateDeps = {
    adminSecret: 'sekret',
    findOrderIdByCode: async (code) => (code === 'PG-X' ? 'oid-1' : null),
    appendHistory: async (id, status, note) => { appended.push({ id, status, note }); },
    setStatus: async (id, status) => { set.push({ id, status }); },
    ...overrides,
  };
  return { deps, appended, set };
}

describe('isFulfillmentStatus', () => {
  it('accepts known statuses and rejects others', () => {
    expect(isFulfillmentStatus('printing')).toBe(true);
    expect(isFulfillmentStatus('delivered')).toBe(true);
    expect(isFulfillmentStatus('banana')).toBe(false);
    expect(isFulfillmentStatus(undefined)).toBe(false);
  });
});

describe('handleStatusUpdate', () => {
  it('returns 503 when the admin secret is not configured', async () => {
    const { deps, appended } = makeDeps({ adminSecret: undefined });
    const r = await handleStatusUpdate('PG-X', 'whatever', { status: 'printing' }, deps);
    expect(r.status).toBe(503);
    expect(appended).toHaveLength(0);
  });

  it('returns 401 on a missing or wrong secret (no state change)', async () => {
    const { deps, appended } = makeDeps();
    expect((await handleStatusUpdate('PG-X', null, { status: 'printing' }, deps)).status).toBe(401);
    expect((await handleStatusUpdate('PG-X', 'nope', { status: 'printing' }, deps)).status).toBe(401);
    expect(appended).toHaveLength(0);
  });

  it('returns 400 on an invalid/missing status', async () => {
    const { deps } = makeDeps();
    expect((await handleStatusUpdate('PG-X', 'sekret', { status: 'banana' }, deps)).status).toBe(400);
    expect((await handleStatusUpdate('PG-X', 'sekret', {}, deps)).status).toBe(400);
  });

  it('returns 404 when the order does not exist', async () => {
    const { deps } = makeDeps();
    expect((await handleStatusUpdate('PG-NOPE', 'sekret', { status: 'printing' }, deps)).status).toBe(404);
  });

  it('appends history and sets the status on a valid update', async () => {
    const { deps, appended, set } = makeDeps();
    const r = await handleStatusUpdate('PG-X', 'sekret', { status: 'shipped', note: 'BlueDart 12345' }, deps);
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(r.message).toBe('shipped');
    expect(appended).toEqual([{ id: 'oid-1', status: 'shipped', note: 'BlueDart 12345' }]);
    expect(set).toEqual([{ id: 'oid-1', status: 'shipped' }]);
  });

  it('stores a blank note as null', async () => {
    const { deps, appended } = makeDeps();
    await handleStatusUpdate('PG-X', 'sekret', { status: 'approved', note: '   ' }, deps);
    expect(appended[0]!.note).toBeNull();
  });
});
