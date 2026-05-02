import { describe, it, expect } from 'vitest';
import { calculateZeroFees } from '../src/engine/u14.js';
import { mixFromMarginals } from '../src/fromMarginals.js';

describe('Zero Fees streams (U14 / U6)', () => {
  it('returns $0 for a population with no children', () => {
    const mix = mixFromMarginals({
      practiceType: 'Non-Access',
      ageCounts: { '0-4': 0, '5-14': 0, '15-24': 100, '25-44': 100, '45-64': 100, '65+': 100 },
      maoriPacificCount: 0, dep9to10Count: 0, cscCount: 0,
    });
    const r = calculateZeroFees(mix);
    expect(r.totalAnnual).toBe(0);
  });

  it('defaults to U14 scheme when zeroFeesScheme is unset', () => {
    const r = calculateZeroFees({
      practiceType: 'Non-Access',
      cells: [
        { ageBand: '5-14', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', huhc: 'N', csc: 'N', count: 100 },
      ],
    });
    expect(r.stream).toBe('u14');
    // 100 patients × $93.0264/yr (U14 5-14 F rate)
    expect(r.totalAnnual).toBeCloseTo(9302.64, 2);
  });

  it('U6 scheme pays a tiny fraction of U14 at the 5-14 band', () => {
    const cell = (gender: 'F' | 'M') => ({
      ageBand: '5-14' as const, gender, ethnicity: 'other' as const,
      depBand: 'dep1-8' as const, huhc: 'N' as const, csc: 'N' as const, count: 100,
    });
    const u14 = calculateZeroFees({
      practiceType: 'Non-Access', zeroFeesScheme: 'u14',
      cells: [cell('F'), cell('M')],
    });
    const u6 = calculateZeroFees({
      practiceType: 'Non-Access', zeroFeesScheme: 'u6',
      cells: [cell('F'), cell('M')],
    });
    expect(u6.stream).toBe('u6');
    expect(u14.stream).toBe('u14');
    // At 5-14, U14 ≈ $93/yr, U6 ≈ $4/yr — 20×+ ratio
    expect(u14.totalAnnual / u6.totalAnnual).toBeGreaterThan(20);
  });

  it('U6 and U14 pay identical 0-4 rates', () => {
    const cell = (gender: 'F' | 'M') => ({
      ageBand: '0-4' as const, gender, ethnicity: 'other' as const,
      depBand: 'dep1-8' as const, huhc: 'N' as const, csc: 'N' as const, count: 100,
    });
    const u14 = calculateZeroFees({
      practiceType: 'Non-Access', zeroFeesScheme: 'u14',
      cells: [cell('F'), cell('M')],
    });
    const u6 = calculateZeroFees({
      practiceType: 'Non-Access', zeroFeesScheme: 'u6',
      cells: [cell('F'), cell('M')],
    });
    expect(u14.totalAnnual).toBeCloseTo(u6.totalAnnual, 4);
  });

  it('only depends on age band × gender, not on ethnicity / dep / CSC / HUHC', () => {
    const baseAges = { '0-4': 100, '5-14': 200, '15-24': 0, '25-44': 0, '45-64': 0, '65+': 0 };
    const a = calculateZeroFees(mixFromMarginals({
      practiceType: 'Non-Access', ageCounts: baseAges,
      maoriPacificCount: 100, dep9to10Count: 100, cscCount: 50,
    }));
    const b = calculateZeroFees(mixFromMarginals({
      practiceType: 'Access', ageCounts: baseAges,
      maoriPacificCount: 0, dep9to10Count: 0, cscCount: 0,
    }));
    expect(a.totalAnnual).toBeCloseTo(b.totalAnnual, 6);
  });
});
