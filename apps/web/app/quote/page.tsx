import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { QuotePage } from './QuotePage';

export const metadata: Metadata = {
  title: 'Quote',
  description:
    'Drop an STL, pick material and finish, see the price. PrintGrid Studio quotes are calculated in your browser — nothing uploads until you check out.',
};

export default function QuoteRoute() {
  return (
    <Section bg="ink" gridPaper>
      <QuotePage />
    </Section>
  );
}
