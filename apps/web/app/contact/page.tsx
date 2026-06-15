import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { ContactForm } from './ContactForm';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'WhatsApp +91 75400 23670 or email aadharsh.j10@gmail.com. PrintGrid Studio replies within one working day.',
};

const DETAILS: ReadonlyArray<
  | { label: string; value: string; href: string; external?: boolean }
  | { label: string; value: string }
> = [
  {
    label: 'WHATSAPP',
    value: '+91 75400 23670',
    href: 'https://wa.me/917540023670',
    external: true,
  },
  {
    label: 'EMAIL',
    value: 'aadharsh.j10@gmail.com',
    href: 'mailto:aadharsh.j10@gmail.com',
  },
  { label: 'HOURS', value: 'Mon–Sat · 10:00–19:00 IST' },
  { label: 'LOCATION', value: 'Anna Nagar · Chennai 600 040' },
  { label: 'REPLY SLA', value: 'Within one working day' },
];

export default function ContactPage() {
  return (
    <>
      <Section bg="paper" gridPaper>
        <Container>
          <div className={styles.intro}>
            <p className={`h-eyebrow ${styles.eyebrow}`}>
              CONTACT · PRINTGRID STUDIO
            </p>
            <h1 className={`display ${styles.heroHeadline}`}>
              Talk to a human.
            </h1>
            <p className={`lede ${styles.heroLede}`}>
              WhatsApp is the fastest way to reach the studio — that's
              where the printer queue questions, file feedback, and
              "where's my order" check-ins go. Email works for anything
              that needs a paper trail. The form below also works.
            </p>
          </div>

          <div className={styles.layout}>
            <div className={styles.left}>
              <p className={styles.directHeading}>FASTEST · WHATSAPP</p>
              <a
                href="https://wa.me/917540023670"
                className={styles.whatsappCta}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp · +91 75400 23670
              </a>
              <p className={styles.directNote}>
                Replies during studio hours, usually within an hour.
                Outside hours: same or next morning.
              </p>

              <ul className={styles.detailList}>
                {DETAILS.map((d) => (
                  <li key={d.label} className={styles.detailRow}>
                    <span className={styles.detailLabel}>{d.label}</span>
                    {'href' in d ? (
                      <a
                        href={d.href}
                        className={styles.detailValue}
                        target={d.external ? '_blank' : undefined}
                        rel={d.external ? 'noopener noreferrer' : undefined}
                      >
                        {d.value}
                      </a>
                    ) : (
                      <span className={styles.detailValue}>{d.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
