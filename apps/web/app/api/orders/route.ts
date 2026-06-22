import { createOrderFromFiles, type FileConfig } from '@/lib/server/orders-service';
import { validateAddress, type ShippingAddress } from '@/lib/address';

export const runtime = 'nodejs';
export const maxDuration = 60;

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad('expected multipart/form-data');
  }

  const fileEntries = form.getAll('file').filter((f): f is File => f instanceof File && f.size > 0);
  if (fileEntries.length === 0) return bad('at least one model file (field "file") is required');

  let meta: {
    configs?: FileConfig[];
    rush?: boolean;
    promo?: string | null;
    email?: string | null;
    address?: Partial<ShippingAddress>;
  };
  try {
    meta = JSON.parse(String(form.get('meta') ?? '{}'));
  } catch {
    return bad('invalid meta json');
  }
  const configs = meta.configs ?? [];
  if (configs.length !== fileEntries.length) return bad('configs must match the number of files');

  // Shipping address is required and validated server-side (the authoritative gate).
  const av = validateAddress(meta.address);
  if (!av.ok) return bad(`Invalid shipping address: ${av.errors.join('; ')}`);

  // NOTE: no client-sent amount/volume is ever read — the server reprices.
  const files = await Promise.all(
    fileEntries.map(async (f, i) => ({
      buffer: Buffer.from(await f.arrayBuffer()),
      filename: f.name,
      config: configs[i] as FileConfig,
    })),
  );

  try {
    const result = await createOrderFromFiles(files, {
      rush: meta.rush,
      promo: (meta.promo as Parameters<typeof createOrderFromFiles>[1]['promo']) ?? null,
      email: meta.email ?? null,
      address: meta.address as ShippingAddress,
    });
    return Response.json(result);
  } catch (e) {
    return bad((e as Error).message);
  }
}
