// apps/web/app/quote/page.tsx
import type { Metadata } from 'next';
import { QuotePage } from './QuotePage';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Quote',
  description:
    'Drop an STL, pick material and finish, see the price. PrintGrid Studio quotes are calculated in your browser — nothing uploads until you check out.',
};

export default function QuoteRoute() {
  return (
    <div className={styles.page}>
      <QuotePage />
    </div>
  );
}
