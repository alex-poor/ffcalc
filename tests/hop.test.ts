import { describe, it, expect } from 'vitest';
import { calculateHop } from '../src/engine/hop.js';
import type { PopulationMix, PopulationCell } from '../src/types.js';

const cell = (over: Partial<PopulationCell> & { count: number }): PopulationCell => ({
  ageBand: '25-44', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', huhc: 'N', csc: 'N',
  ...over,
});
const mix = (cells: PopulationCell[]): PopulationMix => ({ practiceType: 'Non-Access', cells });

describe('HOP calculation', () => {
  it('returns zero for empty roster', () => {
    expect(calculateHop(mix([])).totalAnnual).toBe(0);
  });

  it('applies the MP/dep9-10 top rate', () => {
    // 1000 patients * $3.5976/yr
    const r = calculateHop(mix([cell({ count: 1000, ethnicity: 'maori-pacific', depBand: 'dep9-10' })]));
    expect(r.totalAnnual).toBeCloseTo(3597.6, 4);
  });

  it('excludes HUHC=Y patients', () => {
    const r = calculateHop(mix([cell({ count: 1000, huhc: 'Y', ethnicity: 'maori-pacific', depBand: 'dep9-10' })]));
    expect(r.totalAnnual).toBe(0);
  });

  it('aggregates across ethnicity/dep combinations', () => {
    // other/dep1-8: 100 * 2.5692 = 256.92
    // MP/dep1-8:    100 * 3.0828 = 308.28
    // other/dep9-10: 100 * 3.0828 = 308.28
    // MP/dep9-10:    100 * 3.5976 = 359.76
    // total = 1233.24
    const r = calculateHop(mix([
      cell({ count: 100, ethnicity: 'other',         depBand: 'dep1-8' }),
      cell({ count: 100, ethnicity: 'maori-pacific', depBand: 'dep1-8' }),
      cell({ count: 100, ethnicity: 'other',         depBand: 'dep9-10' }),
      cell({ count: 100, ethnicity: 'maori-pacific', depBand: 'dep9-10' }),
    ]));
    expect(r.totalAnnual).toBeCloseTo(1233.24, 4);
  });

  it('ignores age/gender/csc dimensions (not dimensioned on them)', () => {
    const a = calculateHop(mix([cell({ count: 50, ageBand: '0-4', gender: 'M', csc: 'Y' })]));
    const b = calculateHop(mix([cell({ count: 50, ageBand: '65+', gender: 'F', csc: 'N' })]));
    expect(a.totalAnnual).toBeCloseTo(b.totalAnnual, 6);
  });
});
