import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The plain-English contract between you and PrintGrid Studio.',
};

export default function TermsPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Terms of service</div>
          <h1 className="display-2">Plain-English terms.</h1>
          <p>Last updated: 2026-05-01</p>
          <p className="lede">
            The contract between you and PrintGrid Studio when you place an order. We&rsquo;ve tried to
            write it like humans actually talk.
          </p>
        </div>
      </section>

      <section className="policy">
        <div className="wrap">
          <div className="prose">
            <h2>Quotes and orders</h2>
            <p>
              Quotes are valid for 7 days. Prices are in INR, exclusive of GST and shipping (both
              shown at checkout). An order is binding once payment clears via Razorpay.
            </p>

            <h2>What we promise</h2>
            <ul>
              <li>To print using the parameters you select. We won&rsquo;t substitute material or finish without telling you first.</li>
              <li>To flag printability issues (thin walls, unprintable overhangs, unit mismatches) before printing — not after.</li>
              <li>Lead time of 3–5 days from when payment clears, plus transit time. Longer lead times are quoted in advance for batch jobs.</li>
            </ul>

            <h2>What we don&rsquo;t promise</h2>
            <ul>
              <li>Tolerances tighter than ± 0.15 mm without explicit prior agreement.</li>
              <li>That every part will print successfully on the first try — we re-print free if a print fails for our reasons (machine, material, calibration). See the refund policy.</li>
              <li>Compatibility with end-use applications you haven&rsquo;t disclosed. If a part is for medical, aerospace, food-contact, or load-bearing safety-critical use, tell us before ordering.</li>
            </ul>

            <h2>Liability</h2>
            <p>
              Our liability per order is capped at the order&rsquo;s total value. We are not liable for
              indirect or consequential damages. This isn&rsquo;t a legal opinion — talk to a lawyer if
              you&rsquo;re shipping safety-critical parts.
            </p>

            <h2>Intellectual property</h2>
            <p>
              You retain all rights to models you upload. We do not claim ownership and we do not
              reuse your designs. Print outputs are yours upon delivery and payment.
            </p>

            <h2>Disputes</h2>
            <p>Indian law applies. Jurisdiction: courts in Chennai.</p>
          </div>
        </div>
      </section>
    </>
  );
}
