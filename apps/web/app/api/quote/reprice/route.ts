import { quote, type QuoteInput } from '@printgrid/pricing';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: QuoteInput;
  try {
    body = (await req.json()) as QuoteInput;
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    return Response.json({ error: 'files[] is required' }, { status: 400 });
  }
  try {
    return Response.json(quote(body));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
