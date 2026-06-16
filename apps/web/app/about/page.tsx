import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'A small FDM 3D printing studio in Chennai. Real materials, honest prices.',
};

export default function AboutPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">About</div>
          <h1 className="display-2">A small studio in Chennai.</h1>
          <p className="lede">
            One person, a row of calibrated FDM machines, and a refusal to hide prices behind a
            &lsquo;contact us&rsquo; form.
          </p>
        </div>
      </section>

      <section className="policy">
        <div className="wrap">
          <div className="prose">
            <h2>Why PrintGrid exists</h2>
            <p>
              Getting a part 3D-printed in India usually means emailing a file, waiting a day for a
              quote, and hoping the number is fair. We thought that was backwards. So we built a
              studio where you upload an STL, watch a real price appear — computed from your model&rsquo;s
              actual volume — and order in the same minute.
            </p>

            <h2>FDM, done properly</h2>
            <p>
              We focus on FDM and nothing else. Seven materials kept in stock, from everyday PLA+ to
              carbon-filled nylon, printed on machines we calibrate ourselves. No outsourcing, no
              &lsquo;available on request&rsquo;, no surprises on the invoice.
            </p>

            <h2>How we price</h2>
            <p>
              The price is the printed mass times a published per-gram rate, plus a flat setup fee,
              GST and the payment processor&rsquo;s cut — all shown line by line before you pay. The same
              math runs in your browser and on our server, so the quote you see is the price you pay.
            </p>

            <h2>Where we are</h2>
            <p>
              Anna Nagar, Chennai. We ship pan-India in four days through registered couriers, and
              Hyderabad pickup opens late June 2026. Questions? The{' '}
              <a href="/contact">contact page</a> has every way to reach us.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
