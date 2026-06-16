import type { Metadata } from 'next';
import { MaterialsExplorer } from './MaterialsExplorer';

export const metadata: Metadata = {
  title: 'Materials',
  description:
    "Compare PrintGrid Studio's seven FDM materials — cost, tensile strength, temperature resistance, flexibility, and typical applications.",
};

export default function MaterialsPage() {
  return (
    <>
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
