import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'WhatsApp, email, and studio hours for PrintGrid Studio, Chennai.',
};

export default function ContactPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Contact</div>
          <h1 className="display-2">WhatsApp, email, hours.</h1>
          <p className="lede">
            The fastest way to reach us is WhatsApp. For quotes, just upload your STL — the price is
            instant.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="contact-grid">
            <div className="contact-card">
              <span className="contact-card__label">WhatsApp</span>
              <a className="contact-card__value" href="https://wa.me/917540023670" target="_blank" rel="noopener noreferrer">
                +91 75400 23670
              </a>
              <span className="contact-card__meta">Fastest for quotes &amp; order questions</span>
            </div>
            <div className="contact-card">
              <span className="contact-card__label">Email</span>
              <a className="contact-card__value" href="mailto:aadharsh.j10@gmail.com">
                aadharsh.j10@gmail.com
              </a>
              <span className="contact-card__meta">NDAs, batch jobs, anything detailed</span>
            </div>
            <div className="contact-card">
              <span className="contact-card__label">Studio</span>
              <span className="contact-card__value">Anna Nagar, Chennai</span>
              <span className="contact-card__meta">Mon–Sat · 10–7 IST · local pickup free</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
