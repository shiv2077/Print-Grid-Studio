import { describe, expect, it } from 'vitest';
import { MATERIAL_TABLE, FLEXIBILITIES } from '../lib/materials-data';
import { MATERIALS } from '@printgrid/pricing';

describe('materials-data', () => {
  it('has all 7 materials with content and the real pricing specs', () => {
    expect(MATERIAL_TABLE).toHaveLength(7);
    for (const m of MATERIAL_TABLE) {
      expect(m.use.length).toBeGreaterThan(10);
      expect(m.finish.length).toBeGreaterThan(0);
      expect(FLEXIBILITIES).toContain(m.flexibility);
      // quantitative fields must come straight from @printgrid/pricing (not forked)
      expect(m.ratePerGramPaise).toBe(MATERIALS[m.key].ratePerGramPaise);
      expect(m.tensileMpa).toBe(MATERIALS[m.key].tensileMpa);
      expect(m.maxTempC).toBe(MATERIALS[m.key].maxTempC);
      expect(m.density).toBe(MATERIALS[m.key].density);
    }
  });
});
