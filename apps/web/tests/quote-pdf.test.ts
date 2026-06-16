import { describe, expect, it } from 'vitest';
import { renderQuotePdf, type PdfQuoteInput } from '../lib/server/quote-pdf';

const SAMPLE: PdfQuoteInput = {
  files: [
    {
      filename: 'cube.stl',
      volumeMm3: 1000,
      bboxSize: [10, 10, 10],
      triangleCount: 12,
      config: { materialKey: 'petg', layerHeight: '0.20', finish: 'as-printed', multicolor: false, qty: 1 },
    },
  ],
};

function isPdf(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.slice(0, 5)).toString('latin1') === '%PDF-';
}

describe('renderQuotePdf', () => {
  it('renders a non-empty PDF for a sample quote', async () => {
    const bytes = await renderQuotePdf(SAMPLE, { dateLabel: '01 Jan 2026' });
    expect(bytes.byteLength).toBeGreaterThan(800);
    expect(isPdf(bytes)).toBe(true);
  });

  it('throws when there are no files', async () => {
    await expect(renderQuotePdf({ files: [] })).rejects.toThrow();
  });

  it('renders a multi-file quote with rush + a part that triggers warnings', async () => {
    const bytes = await renderQuotePdf({
      files: [
        SAMPLE.files[0]!,
        {
          filename: 'thin-plate.stl',
          volumeMm3: 10,
          bboxSize: [300, 300, 0.5],
          triangleCount: 300_000,
          config: { materialKey: 'abs', layerHeight: '0.20', finish: 'sanded', multicolor: true, qty: 2 },
        },
      ],
      rush: true,
    });
    expect(isPdf(bytes)).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
