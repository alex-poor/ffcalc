import { describe, it, expect } from 'vitest';
import { calculateCareplus } from '../src/engine/careplus.js';
import type { PopulationMix, PopulationCell } from '../src/types.js';

const cell = (over: Partial<PopulationCell> & { count: number }): PopulationCell => ({
  ageBand: '25-44', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', huhc: 'N', csc: 'N',
  ...over,
});

const mix = (cells: PopulationCell[]): PopulationMix => ({ practiceType: 'Non-Access', cells });

describe('CarePlus calculation', () => {
  it('returns zero for an empty roster', () => {
    expect(calculateCareplus(mix([])).totalAnnual).toBe(0);
  });

  it('applies the top-rate cell correctly (65+ M dep9-10 Māori/Pacific)', () => {
    const r = calculateCareplus(mix([
      cell({ ageBand: '65+', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', count: 100 }),
    ]));
    expect(r.totalAnnual).toBeCloseTo(11856.3636, 4);
  });

  it('ignores HUHC and CSC flags (CarePlus is not dimensioned on them)', () => {
    const a = calculateCareplus(mix([cell({ count: 50, huhc: 'Y', csc: 'Y' })]));
    const b = calculateCareplus(mix([cell({ count: 50, huhc: 'N', csc: 'N' })]));
    expect(a.totalAnnual).toBeCloseTo(b.totalAnnual, 6);
  });

  it('sums across multiple cells', () => {
    const r = calculateCareplus(mix([
      cell({ ageBand: '0-4', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', count: 500 }),
      cell({ ageBand: '65+', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', count: 100 }),
    ]));
    // 500 * 4.337694 + 100 * 118.563636 = 2168.847 + 11856.3636
    expect(r.totalAnnual).toBeCloseTo(14025.2106, 4);
  });

  it('carries rate-table metadata into the result', () => {
    const r = calculateCareplus(mix([cell({ count: 1 })]));
    expect(r.stream).toBe('careplus');
    expect(r.effectiveDate).toBe('2025-07-01');
    expect(r.source).toContain('careplus');
  });
});
