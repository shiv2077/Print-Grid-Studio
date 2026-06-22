import { handleRazorpayWebhook } from '@/lib/server/webhook';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  // RAW bytes — never a parsed body — are what the HMAC is computed over.
  const raw = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const outcome = await handleRazorpayWebhook(raw, signature);
  return Response.json(
    outcome.ok ? { status: outcome.message } : { error: outcome.message },
    { status: outcome.status },
  );
}
