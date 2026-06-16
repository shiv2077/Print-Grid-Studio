import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What PrintGrid Studio collects, and what it does not.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Privacy</div>
          <h1 className="display-2">What we collect. What we don&rsquo;t.</h1>
          <p>Last updated: 2026-05-01</p>
          <p className="lede">
            Short version: we keep order data, your STL files, and nothing else. No tracking. No ads.
            No data sales.
          </p>
        </div>
      </section>

      <section className="policy">
        <div className="wrap">
          <div className="prose">
            <h2>What we collect</h2>
            <ul>
              <li>Order data — name, email, phone, delivery address. Used to print, ship, and contact you. That&rsquo;s it.</li>
              <li>Uploaded models — STL/OBJ/3MF files you submit. Stored on our server, used only to fulfil your order. Deleted on request.</li>
              <li>Payment data — handled entirely by Razorpay. We never see, store, or transmit card numbers, UPI PINs, or bank credentials.</li>
              <li>Server logs — basic access logs for security. No third-party trackers, no behavioural profiling.</li>
            </ul>

            <h2>What we don&rsquo;t do</h2>
            <ul>
              <li>Sell, rent, or share your data with third parties.</li>
              <li>Use your uploaded models for marketing, training, or anything other than your specific order — unless you sign a written release.</li>
              <li>Send marketing email unless you explicitly opt in.</li>
            </ul>

            <h2>Your rights</h2>
            <p>
              You can request a copy of all data we hold on you, request correction, or request
              deletion (within legal/tax retention limits — invoices must be kept 8 years per Indian
              law). Email <a href="mailto:aadharsh.j10@gmail.com">aadharsh.j10@gmail.com</a>.
            </p>

            <h2>NDAs</h2>
            <p>We sign mutual NDAs at no cost for client work. Send your template or use ours.</p>
          </div>
        </div>
      </section>
    </>
  );
}
