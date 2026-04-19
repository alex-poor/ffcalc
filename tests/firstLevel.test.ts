import { describe, it, expect } from 'vitest';
import { calculateFirstLevel } from '../src/engine/firstLevel.js';
import type { PopulationMix, PopulationCell, PracticeType } from '../src/types.js';

const cell = (over: Partial<PopulationCell> & { count: number }): PopulationCell => ({
  ageBand: '25-44', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', huhc: 'N', csc: 'N',
  ...over,
});
const mix = (practiceType: PracticeType, cells: PopulationCell[]): PopulationMix => ({ practiceType, cells });

describe('First-Level Services calculation', () => {
  it('returns zero for empty roster', () => {
    expect(calculateFirstLevel(mix('Non-Access', [])).totalAnnual).toBe(0);
  });

  it('applies the 0-4 F non-HUHC base rate', () => {
    // 100 patients * $546.5244 = $54,652.44
    const r = calculateFirstLevel(mix('Non-Access', [cell({ count: 100, ageBand: '0-4', gender: 'F' })]));
    expect(r.totalAnnual).toBeCloseTo(54652.44, 2);
  });

  it('Access and Non-Access differ only at age 5-14 non-HUHC', () => {
    const cells: PopulationCell[] = [
      cell({ count: 100, ageBand: '5-14', gender: 'F' }), // F non-HUHC: Access 156.2472 vs Non-Access 140.7084
      cell({ count: 100, ageBand: '5-14', gender: 'M' }), // M non-HUHC: Access 146.2500 vs Non-Access 133.3536
    ];
    const access = calculateFirstLevel(mix('Access', cells)).totalAnnual;
    const nonAccess = calculateFirstLevel(mix('Non-Access', cells)).totalAnnual;
    // delta = 100*(156.2472-140.7084) + 100*(146.2500-133.3536) = 1553.88 + 1289.64 = 2843.52
    expect(access - nonAccess).toBeCloseTo(2843.52, 2);
  });

  it('Access and Non-Access agree for non-5-14 non-HUHC cells', () => {
    const cells: PopulationCell[] = [
      cell({ count: 100, ageBand: '0-4',   gender: 'M' }),
      cell({ count: 100, ageBand: '15-24', gender: 'F' }),
      cell({ count: 100, ageBand: '65+',   gender: 'M' }),
    ];
    expect(calculateFirstLevel(mix('Access', cells)).totalAnnual)
      .toBeCloseTo(calculateFirstLevel(mix('Non-Access', cells)).totalAnnual, 2);
  });

  it('HUHC rate is identical between Access and Non-Access', () => {
    const cells: PopulationCell[] = [cell({ count: 100, ageBand: '5-14', gender: 'F', huhc: 'Y' })];
    expect(calculateFirstLevel(mix('Access', cells)).totalAnnual)
      .toBeCloseTo(calculateFirstLevel(mix('Non-Access', cells)).totalAnnual, 2);
  });

  it('applies CSC top-up at Non-Access practices for CSC=Y', () => {
    // 25-44 F CSC top-up = $132.3036; base 25-44 F non-HUHC = $143.7384
    const cells: PopulationCell[] = [cell({ count: 100, ageBand: '25-44', gender: 'F', csc: 'Y' })];
    const r = calculateFirstLevel(mix('Non-Access', cells));
    expect(r.totalAnnual).toBeCloseTo(100 * (143.7384 + 132.3036), 2);
  });

  it('does NOT apply CSC top-up at Access practices', () => {
    const cells: PopulationCell[] = [cell({ count: 100, ageBand: '25-44', gender: 'F', csc: 'Y' })];
    const r = calculateFirstLevel(mix('Access', cells));
    expect(r.totalAnnual).toBeCloseTo(100 * 143.7384, 2);
  });

  it('0-4 CSC top-up is $0 (kids free-visit policy)', () => {
    const withCsc = calculateFirstLevel(mix('Non-Access', [cell({ count: 100, ageBand: '0-4', gender: 'F', csc: 'Y' })]));
    const without = calculateFirstLevel(mix('Non-Access', [cell({ count: 100, ageBand: '0-4', gender: 'F', csc: 'N' })]));
    expect(withCsc.totalAnnual).toBeCloseTo(without.totalAnnual, 2);
  });
});
