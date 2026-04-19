import { describe, it, expect } from 'vitest';
import { calculateSia } from '../src/engine/sia.js';
import type { PopulationMix, PopulationCell } from '../src/types.js';

const cell = (over: Partial<PopulationCell> & { count: number }): PopulationCell => ({
  ageBand: '25-44', gender: 'F', ethnicity: 'other', depBand: 'dep1-8', huhc: 'N', csc: 'N',
  ...over,
});
const mix = (cells: PopulationCell[]): PopulationMix => ({ practiceType: 'Non-Access', cells });

describe('SIA calculation', () => {
  it('returns zero for empty roster', () => {
    expect(calculateSia(mix([])).totalAnnual).toBe(0);
  });

  it('pays zero for non-Māori/Pacific in low-dep areas', () => {
    const r = calculateSia(mix([cell({ count: 1000, ethnicity: 'other', depBand: 'dep1-8' })]));
    expect(r.totalAnnual).toBe(0);
  });

  it('pays the MP dep9-10 top rate (0-4 F)', () => {
    // 10 patients * $177.6204 = 1776.204
    const r = calculateSia(mix([cell({
      count: 10, ageBand: '0-4', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10',
    })]));
    expect(r.totalAnnual).toBeCloseTo(1776.204, 4);
  });

  it('excludes HUHC=Y patients', () => {
    const r = calculateSia(mix([cell({
      count: 1000, huhc: 'Y', ethnicity: 'maori-pacific', depBand: 'dep9-10',
    })]));
    expect(r.totalAnnual).toBe(0);
  });

  it('verifies the pattern: (MP,dep9-10) = 2× (MP,dep1-8) at the same age/gender', () => {
    const lo = calculateSia(mix([cell({
      count: 100, ageBand: '45-64', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',
    })]));
    const hi = calculateSia(mix([cell({
      count: 100, ageBand: '45-64', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10',
    })]));
    expect(hi.totalAnnual).toBeCloseTo(2 * lo.totalAnnual, 4);
  });

  it('verifies the pattern: (other,dep9-10) = (MP,dep1-8) at the same age/gender', () => {
    const mpLow = calculateSia(mix([cell({
      count: 100, ageBand: '45-64', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',
    })]));
    const otherHigh = calculateSia(mix([cell({
      count: 100, ageBand: '45-64', gender: 'M', ethnicity: 'other', depBand: 'dep9-10',
    })]));
    expect(otherHigh.totalAnnual).toBeCloseTo(mpLow.totalAnnual, 4);
  });
});
