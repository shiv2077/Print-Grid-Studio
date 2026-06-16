import type { Metadata } from 'next';
import { MaterialsExplorer } from './MaterialsExplorer';
import { MATERIAL_TABLE } from '@/lib/materials-data';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Materials',
  description:
    "Compare PrintGrid Studio's seven FDM materials — cost, tensile strength, temperature resistance, flexibility, and typical applications.",
  alternates: { canonical: '/materials' },
};

const materialsLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'PrintGrid Studio FDM materials',
  itemListElement: MATERIAL_TABLE.map((m, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      name: `${m.name} FDM 3D printing`,
      description: m.use,
      category: '3D printing material',
      url: `${SITE_URL}/materials`,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: (m.ratePerGramPaise / 100).toFixed(2),
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          priceCurrency: 'INR',
          price: (m.ratePerGramPaise / 100).toFixed(2),
          unitText: 'gram',
        },
      },
    },
  })),
};

export default function MaterialsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(materialsLd) }} />
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Materials</div>
          <h1 className="display-2">Seven FDM materials, compared.</h1>
          <p className="lede">
            Sort by cost, strength, or temperature. Filter by flexibility. Open a row for the full
            spec and what it&rsquo;s good for. All seven kept in stock.
          </p>
        </div>
      </section>

      <section className="materials">
        <div className="wrap">
          <MaterialsExplorer />
        </div>
      </section>
    </>
  );
}
