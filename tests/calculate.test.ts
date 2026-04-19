import { describe, it, expect } from 'vitest';
import { calculateAll } from '../src/engine/calculate.js';
import type { PopulationMix, PopulationCell } from '../src/types.js';

const cell = (over: Partial<PopulationCell> & { count: number }): PopulationCell => ({
  ageBand: '25-44', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', huhc: 'N', csc: 'N',
  ...over,
});

describe('calculateAll orchestrator', () => {
  it('returns all four streams with consistent total', () => {
    const mix: PopulationMix = {
      practiceType: 'Non-Access',
      cells: [
        cell({ count: 500, ageBand: '0-4',   gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10' }),
        cell({ count: 800, ageBand: '25-44', gender: 'M', ethnicity: 'other',         depBand: 'dep1-8' }),
        cell({ count: 300, ageBand: '65+',   gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10' }),
      ],
    };
    const r = calculateAll(mix);
    expect(r.streams.map(s => s.stream)).toEqual(['first-level', 'hop', 'sia', 'careplus']);
    const summed = r.streams.reduce((a, s) => a + s.totalAnnual, 0);
    expect(r.totalAnnual).toBeCloseTo(summed, 6);
    expect(r.totalAnnual).toBeGreaterThan(0);
  });

  it('every stream carries effectiveDate and source', () => {
    const r = calculateAll({ practiceType: 'Non-Access', cells: [cell({ count: 1 })] });
    for (const s of r.streams) {
      expect(s.effectiveDate).toBeTruthy();
      expect(s.source).toBeTruthy();
    }
  });
});
