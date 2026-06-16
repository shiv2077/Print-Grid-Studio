import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Materials',
  description: 'Seven FDM materials kept in stock — PLA+, PLA LW, PETG, ABS, TPU 95A, PA6, PA-CF.',
};

interface Material {
  name: string;
  rate: string;
  use: string;
  specs: { label: string; value: string }[];
}

const MATERIALS: Material[] = [
  {
    name: 'PLA+',
    rate: '₹4.50 / g',
    use: 'Drone frames, brackets, and mechanical mounts. Tougher than PLA without ABS warping or fumes.',
    specs: [
      { label: 'Density', value: '1.24 g/cm³' },
      { label: 'Tensile', value: '65 MPa' },
      { label: 'Max temp', value: '60 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
  {
    name: 'PLA LW',
    rate: '₹18.00 / g',
    use: 'RC/UAV airframe parts. Foaming PLA expands during print — extreme weight savings at the cost of brittleness.',
    specs: [
      { label: 'Density', value: '0.65 g/cm³ eff.' },
      { label: 'Tensile', value: '35 MPa' },
      { label: 'Max temp', value: '55 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
  {
    name: 'PETG',
    rate: '₹5.00 / g',
    use: 'Outdoor housings, electronics enclosures, and parts that see sun, rain, or warm engine-bay temperatures.',
    specs: [
      { label: 'Density', value: '1.27 g/cm³' },
      { label: 'Tensile', value: '50 MPa' },
      { label: 'Max temp', value: '75 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
  {
    name: 'ABS',
    rate: '₹5.50 / g',
    use: "Workshop jigs and fixtures you'll drill, tap, sand, or acetone-smooth. Holds up to heat.",
    specs: [
      { label: 'Density', value: '1.04 g/cm³' },
      { label: 'Tensile', value: '40 MPa' },
      { label: 'Max temp', value: '95 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
  {
    name: 'TPU 95A',
    rate: '₹8.50 / g',
    use: 'Gaskets, vibration dampers, flex hinges, and soft grips. Shore 95A — firm but properly bendable.',
    specs: [
      { label: 'Density', value: '1.21 g/cm³' },
      { label: 'Tensile', value: '30 MPa' },
      { label: 'Max temp', value: '80 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
  {
    name: 'PA6',
    rate: '₹20.00 / g',
    use: 'Tough functional parts. Heat-resistant, abrasion-resistant. Hygroscopic — dry before printing.',
    specs: [
      { label: 'Density', value: '1.14 g/cm³' },
      { label: 'Tensile', value: '65 MPa' },
      { label: 'Max temp', value: '110 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
  {
    name: 'PA-CF',
    rate: '₹22 / g',
    use: 'Engineering-grade parts under real load — drone arms, end-effectors, structural mounts. Stiff, light, expensive.',
    specs: [
      { label: 'Density', value: '1.16 g/cm³' },
      { label: 'Tensile', value: '90 MPa' },
      { label: 'Max temp', value: '130 °C' },
      { label: 'Layer heights', value: '0.12–0.28 mm' },
    ],
  },
];

export default function MaterialsPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Materials</div>
          <h1 className="display-2">Seven FDM materials kept in stock.</h1>
          <p className="lede">
            No &lsquo;available on request&rsquo;. If you ordered today, we&rsquo;d be printing tomorrow morning.
          </p>
        </div>
      </section>

      <section className="materials">
        <div className="wrap">
          <div className="materials-grid">
            {MATERIALS.map((m) => (
              <article className="material-card" key={m.name}>
                <div className="material-card__head">
                  <h2 className="material-card__name">{m.name}</h2>
                  <span className="material-card__rate">{m.rate}</span>
                </div>
                <p className="material-card__use">{m.use}</p>
                <div className="material-card__specs">
                  {m.specs.map((s) => (
                    <div className="material-card__spec" key={s.label}>
                      <span className="material-card__spec-label">{s.label}</span>
                      <span className="material-card__spec-value">{s.value}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
