// Material intelligence dataset. Quantitative specs come from the real
// @printgrid/pricing MATERIALS (cost, density, tensile, max temp); the
// qualitative fields (flexibility, finish, typical use) are presentation
// content. No recommendation engine — just the real data, presented well.
import { MATERIALS, type MaterialKey } from '@printgrid/pricing';

export type Flexibility = 'Rigid' | 'Semi-rigid' | 'Flexible';

export interface MaterialInfo {
  key: MaterialKey;
  name: string;
  ratePerGramPaise: number;
  density: number; // g/cm³
  tensileMpa: number;
  maxTempC: number;
  flexibility: Flexibility;
  finish: string;
  use: string;
}

const CONTENT: Record<MaterialKey, { flexibility: Flexibility; finish: string; use: string }> = {
  'pla-plus': {
    flexibility: 'Rigid',
    finish: 'Matte — sands and primes well',
    use: 'Drone frames, brackets, and mechanical mounts. Tougher than PLA without ABS warping or fumes.',
  },
  'pla-lw': {
    flexibility: 'Rigid',
    finish: 'Foamed, textured surface',
    use: 'RC/UAV airframe parts. Foaming PLA expands during print — extreme weight savings at the cost of brittleness.',
  },
  petg: {
    flexibility: 'Semi-rigid',
    finish: 'Glossy — harder to sand',
    use: 'Outdoor housings, electronics enclosures, and parts that see sun, rain, or warm engine-bay temperatures.',
  },
  abs: {
    flexibility: 'Rigid',
    finish: 'Sands well; acetone-smoothable',
    use: "Workshop jigs and fixtures you'll drill, tap, sand, or acetone-smooth. Holds up to heat.",
  },
  'tpu-95a': {
    flexibility: 'Flexible',
    finish: 'Matte, rubbery',
    use: 'Gaskets, vibration dampers, flex hinges, and soft grips. Shore 95A — firm but properly bendable.',
  },
  pa6: {
    flexibility: 'Semi-rigid',
    finish: 'Matte; surface can be fuzzy',
    use: 'Tough functional parts. Heat-resistant, abrasion-resistant. Hygroscopic — dry before printing.',
  },
  'pa-cf': {
    flexibility: 'Rigid',
    finish: 'Matte with carbon speckle',
    use: 'Engineering-grade parts under real load — drone arms, end-effectors, structural mounts. Stiff, light, expensive.',
  },
};

const MATERIAL_KEYS: MaterialKey[] = ['pla-plus', 'pla-lw', 'petg', 'abs', 'tpu-95a', 'pa6', 'pa-cf'];

export const MATERIAL_TABLE: MaterialInfo[] = MATERIAL_KEYS.map((key) => {
  const m = MATERIALS[key];
  return {
    key,
    name: m.name,
    ratePerGramPaise: m.ratePerGramPaise,
    density: m.density,
    tensileMpa: m.tensileMpa,
    maxTempC: m.maxTempC,
    ...CONTENT[key],
  };
});

export const FLEXIBILITIES: Flexibility[] = ['Rigid', 'Semi-rigid', 'Flexible'];
