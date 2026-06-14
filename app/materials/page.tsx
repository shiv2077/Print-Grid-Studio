import type { Metadata } from 'next';
import { MaterialsHero } from './MaterialsHero';
import { MaterialSection } from './MaterialSection';

export const metadata: Metadata = {
  title: 'Materials',
  description:
    'Seven filaments stocked at PrintGrid Studio: PLA+, PLA LW, PETG, ABS, TPU 95A, PA6, PA-CF. Manufacturer datasheet specs, no inflation.',
};

const ENTRIES = [
  {
    materialKey: 'pla-plus' as const,
    body:
      "Our default. PLA+ prints clean, holds tolerance well, and looks " +
      "good with no post-processing. Stiffer and tougher than the " +
      "Bambu basic PLA — closer to PETG without the stringing. Indoor " +
      "use only: it loses strength above 60°C, so don't leave a part " +
      "in a parked car at noon.",
    layerRange: '0.12 – 0.28 mm · default 0.20',
    walls: '3 (default)',
    recommendedFor: 'Prototypes · indoor brackets · enclosures',
    titleBlock: 'PG-MAT-PLA-PLUS',
  },
  {
    materialKey: 'pla-lw' as const,
    body:
      "Foaming PLA. The filament expands during printing, dropping the " +
      "effective density to about half of standard PLA. Drone-frame " +
      "favorite — same volume, almost half the mass. Slower print speed " +
      "and slightly fuzzier surface than PLA+, so it's not the right " +
      "choice for a part where finish matters more than weight.",
    layerRange: '0.16 – 0.24 mm · default 0.20',
    walls: '2 – 3',
    recommendedFor: 'Drone bodies · RC props · flight components',
    titleBlock: 'PG-MAT-PLA-LW',
  },
  {
    materialKey: 'petg' as const,
    body:
      "Tougher than PLA, more flexible, less brittle. Survives outdoor " +
      "use up to 75°C and shrugs off mild chemicals — kitchen-adjacent, " +
      "garden-adjacent. Easier to print than ABS but the layer adhesion " +
      "is fussy, so we run it slower with active cooling tuned per " +
      "geometry. Slight surface haze is normal for PETG; sand or prime " +
      "if you need a perfect finish.",
    layerRange: '0.12 – 0.28 mm · default 0.20',
    walls: '3',
    recommendedFor: 'Outdoor parts · tool handles · food-adjacent',
    titleBlock: 'PG-MAT-PETG',
  },
  {
    materialKey: 'abs' as const,
    body:
      "The classic engineering thermoplastic. Heat resistant up to 95°C, " +
      "easy to glue, sand, paint, and chemically smooth with acetone. " +
      "Warps if printed without an enclosure — both our P1S printers " +
      "have one. Slight smell during printing is normal; we run with " +
      "the chamber filter on.",
    layerRange: '0.12 – 0.28 mm · default 0.20',
    walls: '3 – 4',
    recommendedFor: 'Industrial enclosures · jigs · automotive',
    titleBlock: 'PG-MAT-ABS',
  },
  {
    materialKey: 'tpu-95a' as const,
    body:
      "95A shore hardness — flexible but not gummy. Holds shape under " +
      "moderate compression and recovers cleanly. We print it slow with " +
      "the AMS bypass (TPU is a pain through the multi-material " +
      "selector). Avoid sharp internal corners — TPU likes radii.",
    layerRange: '0.16 – 0.24 mm · default 0.20',
    walls: '3',
    recommendedFor: 'Gaskets · grips · vibration dampers · feet',
    titleBlock: 'PG-MAT-TPU-95A',
  },
  {
    materialKey: 'pa6' as const,
    body:
      "Engineering nylon. High tensile, gear-grade, takes threads well. " +
      "Hygroscopic — we dry every spool before printing and ship within " +
      "24 hours of QC. Stronger than ABS, stiffer than TPU, machinable " +
      "if you need to drill or tap. Prints best with a hardened nozzle " +
      "and a heated chamber.",
    layerRange: '0.16 – 0.24 mm · default 0.20',
    walls: '3 – 4',
    recommendedFor: 'Gears · brackets · threaded inserts · structural',
    titleBlock: 'PG-MAT-PA6',
  },
  {
    materialKey: 'pa-cf' as const,
    body:
      "PA6 with chopped carbon fibre. Stiffer and stronger than plain " +
      "PA6 with a fraction of the weight gain — drone arms, robot " +
      "frames, anything that wants to fail at the bolt rather than the " +
      "part. Abrasive: we keep a hardened nozzle dedicated to it. " +
      "Surface finish has visible CF fibre orientation, which most " +
      "engineering customers prefer; if you want it hidden, prime + paint.",
    layerRange: '0.16 – 0.24 mm · default 0.20',
    walls: '4',
    recommendedFor: 'Drone arms · robot frames · end-use structural',
    titleBlock: 'PG-MAT-PA-CF',
  },
];

export default function MaterialsPage() {
  return (
    <>
      <MaterialsHero />
      {ENTRIES.map((entry, i) => (
        <MaterialSection key={entry.materialKey} index={i} {...entry} />
      ))}
    </>
  );
}
