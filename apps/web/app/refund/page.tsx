import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund policy',
  description: 'Honest refunds — whose fault it is decides what we do.',
};

export default function RefundPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Refund policy</div>
          <h1 className="display-2">Honest refunds, no runaround.</h1>
          <p>Last updated: 2026-05-01</p>
          <p className="lede">
            Whose fault it is decides what we do. Our fault, we re-print or refund. Your file&rsquo;s
            fault, we&rsquo;d have flagged it before printing.
          </p>
        </div>
      </section>

      <section className="policy">
        <div className="wrap">
          <div className="prose">
            <h2>If a print fails for our reasons</h2>
            <p>
              Material issues, machine issues, mis-orientation, post-processing damage, lost in
              transit: we re-print and ship at no charge, or refund in full — your choice. Reach out
              within 7 days of delivery.
            </p>

            <h2>If a part fails because the model wasn&rsquo;t printable as supplied</h2>
            <p>
              Walls thinner than the slicer can produce, supports that no realistic auto-generation
              can rescue, missing watertight geometry — we&rsquo;ll flag these <em>before</em> printing.
              After flagging, you choose to (a) accept and proceed, (b) get a refund minus a ₹100
              review fee, or (c) ask us to redesign at our hourly rate.
            </p>

            <h2>If you cancel before printing starts</h2>
            <p>
              Full refund. We refund via the original Razorpay payment method; the bank typically
              credits within 5–7 business days.
            </p>

            <h2>If you cancel after printing has started</h2>
            <p>
              You&rsquo;re billed for material consumed and machine time used up to that point. The
              remainder is refunded.
            </p>

            <h2>Custom orders and batch jobs over ₹25,000</h2>
            <p>50 % advance is non-refundable once printing starts. Balance due at shipment.</p>

            <h2>How to request a refund</h2>
            <p>
              WhatsApp +91 75400 23670 or email{' '}
              <a href="mailto:aadharsh.j10@gmail.com">aadharsh.j10@gmail.com</a> with your order code.
              We&rsquo;ll verify and process within 24 hours.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
