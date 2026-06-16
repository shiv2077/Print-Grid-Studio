import { renderQuotePdf, type PdfQuoteInput } from '@/lib/server/quote-pdf';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: PdfQuoteInput;
  try {
    body = (await req.json()) as PdfQuoteInput;
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    return Response.json({ error: 'files[] is required' }, { status: 400 });
  }
  try {
    const dateLabel = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const bytes = await renderQuotePdf(body, { dateLabel });
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="printgrid-quote.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
