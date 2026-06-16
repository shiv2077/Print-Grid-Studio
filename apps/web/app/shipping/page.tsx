import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'How parts get to you — couriers, cost, lead time, and packaging.',
};

export default function ShippingPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Shipping</div>
          <h1 className="display-2">How parts get to you.</h1>
          <p>Last updated: 2026-05-01</p>
          <p className="lede">
            Shipped from Chennai (Hyderabad pickup from late June 2026) through registered couriers.
            Tracking attached to every order.
          </p>
        </div>
      </section>

      <section className="policy">
        <div className="wrap">
          <div className="prose">
            <h2>Couriers</h2>
            <p>
              BlueDart and Delhivery, depending on your pincode. Both provide tracking numbers we
              attach to your order — visible on your order page when shipped.
            </p>

            <h2>Cost</h2>
            <p>Flat ₹120 per order. Free above ₹2,500 subtotal. Shown at checkout — no surprises.</p>

            <h2>Lead time vs. transit time</h2>
            <ul>
              <li>Print lead time (3–5 days) starts when payment clears.</li>
              <li>Transit time is on top: 1–3 days within metros, 3–6 days elsewhere.</li>
            </ul>

            <h2>Packaging</h2>
            <p>
              Bubble-wrap inner + corrugated outer. Fragile parts (thin-wall PETG, TPU flex parts)
              get foam padding. If yours arrives damaged, we re-print and re-ship free.
            </p>

            <h2>International</h2>
            <p>
              Custom-quoted on request. Email us with your part list and destination — we&rsquo;ll come
              back with a courier and customs estimate.
            </p>

            <h2>Pickup</h2>
            <p>
              Local pickup from Chennai is free. Choose &lsquo;pickup&rsquo; in order notes or email us — we&rsquo;ll
              respond with available slots. Hyderabad pickup opens late June 2026.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
