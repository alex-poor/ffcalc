import { describe, it, expect } from 'vitest';
import { mixFromMarginals, type PopulationMarginals } from '../src/fromMarginals.js';
import { calculateAll } from '../src/engine/calculate.js';

const baseInput: PopulationMarginals = {
  practiceType: 'Non-Access',
  ageCounts: { '0-4': 10, '5-14': 20, '15-24': 15, '25-44': 30, '45-64': 15, '65+': 10 },
  maoriPacificCount: 10,
  dep9to10Count: 5,
  cscCount: 20,
};

describe('mixFromMarginals', () => {
  it('returns an empty mix for all-zero ageCounts', () => {
    const mix = mixFromMarginals({
      practiceType: 'Non-Access',
      ageCounts: { '0-4': 0, '5-14': 0, '15-24': 0, '25-44': 0, '45-64': 0, '65+': 0 },
      maoriPacificCount: 0, dep9to10Count: 0, cscCount: 0,
    });
    expect(mix.cells).toEqual([]);
  });

  it('preserves total patient count across the expanded cells', () => {
    const mix = mixFromMarginals(baseInput);
    const total = 10 + 20 + 15 + 30 + 15 + 10;
    expect(mix.cells.reduce((a, c) => a + c.count, 0)).toBeCloseTo(total, 6);
  });

  it('defaults female fraction to 0.5 and huhc to 0 when omitted', () => {
    const mix = mixFromMarginals(baseInput);
    const femaleCount = mix.cells.filter(c => c.gender === 'F').reduce((a, c) => a + c.count, 0);
    const total = mix.cells.reduce((a, c) => a + c.count, 0);
    expect(femaleCount / total).toBeCloseTo(0.5, 6);
    expect(mix.cells.some(c => c.huhc === 'Y')).toBe(false); // pruned because fraction is 0
  });

  it('passes practiceType through unchanged', () => {
    expect(mixFromMarginals({ ...baseInput, practiceType: 'Access' }).practiceType).toBe('Access');
    expect(mixFromMarginals({ ...baseInput, practiceType: 'Non-Access' }).practiceType).toBe('Non-Access');
  });

  it('prunes zero-probability branches (HUHC=0 → no HUHC=Y cells)', () => {
    const mix = mixFromMarginals(baseInput);
    expect(mix.cells.every(c => c.huhc === 'N')).toBe(true);
  });

  it('throws when a marginal count exceeds total patients', () => {
    expect(() => mixFromMarginals({ ...baseInput, cscCount: 999 })).toThrow(/cscCount/);
  });

  it('throws when a marginal count is negative', () => {
    expect(() => mixFromMarginals({ ...baseInput, maoriPacificCount: -1 })).toThrow();
  });

  it('plumbs through calculateAll without errors and produces positive totals', () => {
    const mix = mixFromMarginals(baseInput);
    const r = calculateAll(mix);
    expect(r.totalAnnual).toBeGreaterThan(0);
    expect(r.streams.every(s => s.totalAnnual >= 0)).toBe(true);
  });

  it('marginal ratios are reflected in the expansion', () => {
    // 10 of 100 MP → 10% of every cell's count rolls up to maori-pacific
    const mix = mixFromMarginals(baseInput);
    const total = mix.cells.reduce((a, c) => a + c.count, 0);
    const mp = mix.cells.filter(c => c.ethnicity === 'maori-pacific').reduce((a, c) => a + c.count, 0);
    expect(mp / total).toBeCloseTo(10 / 100, 6);
  });
});
