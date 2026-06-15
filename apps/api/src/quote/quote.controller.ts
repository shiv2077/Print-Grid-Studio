import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { quote, type QuoteInput, type QuoteResult } from '@printgrid/pricing';

/**
 * POST /quote/reprice
 *
 * Recomputes a quote server-side via the SHARED @printgrid/pricing engine.
 * This is the same money math the web app uses — never forked. In Phase A
 * there is no DB and no payment; this endpoint only proves the backend
 * consumes the shared package. In M2 the order total is produced here from
 * the SERVER's own measured STL volume, never from a client-sent amount.
 */
@Controller('quote')
export class QuoteController {
  @Post('reprice')
  reprice(@Body() body: QuoteInput): QuoteResult {
    if (!body || !Array.isArray(body.files) || body.files.length === 0) {
      throw new BadRequestException('files[] is required');
    }
    try {
      return quote(body);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }
}
