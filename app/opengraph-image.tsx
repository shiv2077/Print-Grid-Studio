import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt =
  'PrintGrid Studio — custom 3D printing in Chennai, ships pan-India in 4 days';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#F5F5F7',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Title block — vintage-instrument-manual style */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 24,
            borderBottom: '1px solid #C5C5C8',
            color: '#5A5A5E',
            fontSize: 16,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          <span>PG-OG-01 · PRINTGRID STUDIO · CHENNAI</span>
          <span>1200 × 630</span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingTop: 40,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#5A5A5E',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            PRINTGRID · STUDIO
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: '#1D1D1F',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              marginBottom: 32,
            }}
          >
            Custom 3D printing.
            <br />
            Print-grade parts.
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#5A5A5E',
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            Quote in seconds. Ships pan-India in 4 days.
          </div>
        </div>

        {/* Bottom rule + ink dot — monochrome system, no accent colour */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: '1px solid #C5C5C8',
            color: '#5A5A5E',
            fontSize: 18,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>printgridstudio.com</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>BAMBU P1S × 2</span>
            <div
              style={{
                width: 12,
                height: 12,
                background: '#1D1D1F',
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
