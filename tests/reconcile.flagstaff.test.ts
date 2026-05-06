import { describe, it, expect } from 'vitest';
import { calculateAll } from '../src/engine/calculate.js';
import { mixFromMarginals } from '../src/fromMarginals.js';
import type { PopulationCell, PopulationMix } from '../src/types.js';

// Reconciliation: Flagstaff Medical Centre — Pinnacle PHO, April 2026.
// Source: customer-supplied capitation report — full cell-level breakdown
// across 7 GPs aggregated to 5,215 enrolled patients.
//
// This test documents a meaningful model behaviour: when given the EXACT joint
// cell distribution, FFCalc reconciles to Pinnacle to the cent. When given
// only MARGINALS, FFCalc undershoots by ~2.6% because mixFromMarginals expands
// counts under independence — but at this practice CSC is heavily concentrated
// in 65+ patients (244 of 888 CSC patients = 27%, vs 65+ being only 21% of the
// practice), and the CSC top-up at 65+ is the largest in the schedule.
// Spreading CSC uniformly across age bands therefore systematically understates
// the CSC top-up component.
//
// Practical implication: for practices where joint cell counts are available
// (every modern PHO report has them), use FFCalc's joint-cell input mode.
// Marginals mode is a fallback that can undershoot by 2-3% on aged-skewed
// practices.

const c = (
  ageBand: PopulationCell['ageBand'],
  gender: PopulationCell['gender'],
  csc: PopulationCell['csc'],
  huhc: PopulationCell['huhc'],
  count: number,
): PopulationCell => ({
  ageBand, gender, csc, huhc,
  ethnicity: 'other', depBand: 'dep1-8',  // ignored by FL/U14/Contingent
  count,
});

// Exact joint distribution across all 7 GPs (5,215 patients verified).
const flagstaffExactCells: PopulationCell[] = [
  c('0-4',  'F', 'N', 'N', 141),
  c('0-4',  'M', 'N', 'N', 148),
  c('0-4',  'M', 'N', 'Y',   1),
  c('5-14', 'F', 'N', 'N', 333),
  c('5-14', 'F', 'Y', 'N',  56),
  c('5-14', 'F', 'N', 'Y',   1),
  c('5-14', 'M', 'N', 'N', 349),
  c('5-14', 'M', 'Y', 'N',  79),
  c('15-24','F', 'N', 'N', 243),
  c('15-24','F', 'Y', 'N',  70),
  c('15-24','M', 'N', 'N', 275),
  c('15-24','M', 'Y', 'N',  57),
  c('25-44','F', 'N', 'N', 538),
  c('25-44','F', 'Y', 'N',  90),
  c('25-44','M', 'N', 'N', 406),
  c('25-44','M', 'Y', 'N',  45),
  c('25-44','M', 'Y', 'Y',   1),
  c('45-64','F', 'N', 'N', 682),
  c('45-64','F', 'Y', 'N',  70),
  c('45-64','F', 'Y', 'Y',   1),
  c('45-64','M', 'N', 'N', 499),
  c('45-64','M', 'Y', 'N',  41),
  c('65+',  'F', 'N', 'N', 419),
  c('65+',  'F', 'Y', 'N', 244),
  c('65+',  'F', 'N', 'Y',   1),
  c('65+',  'M', 'N', 'N', 291),
  c('65+',  'M', 'Y', 'N', 134),
];

const flagstaffExact: PopulationMix = {
  practiceType: 'Non-Access',
  zeroFeesScheme: 'u14',
  cells: flagstaffExactCells,
};

// Same population, but expanded from MARGINALS (what the customer entered):
const flagstaffMarginals = mixFromMarginals({
  practiceType: 'Non-Access',
  ageCounts: { '0-4': 290, '5-14': 818, '15-24': 645, '25-44': 1080, '45-64': 1293, '65+': 1089 },
  femaleCount: 2889,
  maoriPacificCount: 0,    // doesn't affect FL/U14/Contingent
  dep9to10Count: 0,        // doesn't affect FL/U14/Contingent
  cscCount: 888,
  huhcCount: 5,
});
flagstaffMarginals.zeroFeesScheme = 'u14';

const pinnacleInclGst = {
  base: 131827.36,
  contingent: 6148.98,
  total: 137976.34,
};

describe('Reconciliation: Flagstaff Medical Centre — Pinnacle (April 2026)', () => {
  const exact = calculateAll(flagstaffExact);
  const marginal = calculateAll(flagstaffMarginals);

  const sum = (r: typeof exact, streams: string[]) =>
    r.streams.filter(s => streams.includes(s.stream))
            .reduce((acc, s) => acc + s.totalAnnual, 0);

  // Pinnacle's "Base" = First-Level + U14. "Contingent" = contingent.
  const exactBaseMo  = sum(exact,    ['first-level', 'u14']) / 12;
  const exactContMo  = sum(exact,    ['contingent']) / 12;
  const margBaseMo   = sum(marginal, ['first-level', 'u14']) / 12;
  const margContMo   = sum(marginal, ['contingent']) / 12;

  it('prints reconciliation', () => {
    const fmt = (n: number) => '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (e: number, a: number) => a === 0 ? '—' : `${((e - a) / a * 100).toFixed(2)}%`;

    console.log('\n=================================================================================================');
    console.log('Flagstaff Medical Centre — Pinnacle PHO — April 2026 — 5,215 patients');
    console.log('Practice type: Non-Access · Zero-fees scheme: U14');
    console.log('=================================================================================================');
    console.log('Stream            FFCalc EXACT  FFCalc MARGINALS   Pinnacle    EXACT vs Pin   MARGINALS vs Pin');
    console.log('-------------------------------------------------------------------------------------------------');

    const rows = [
      {
        label: 'Base (FL + U14) excl',
        ex: exactBaseMo, mg: margBaseMo, pn: pinnacleInclGst.base / 1.15,
      },
      {
        label: 'Contingent excl',
        ex: exactContMo, mg: margContMo, pn: pinnacleInclGst.contingent / 1.15,
      },
      {
        label: 'TOTAL excl GST',
        ex: exactBaseMo + exactContMo, mg: margBaseMo + margContMo, pn: pinnacleInclGst.total / 1.15,
      },
      {
        label: 'TOTAL incl GST',
        ex: (exactBaseMo + exactContMo) * 1.15, mg: (margBaseMo + margContMo) * 1.15, pn: pinnacleInclGst.total,
      },
    ];

    for (const r of rows) {
      console.log(
        r.label.padEnd(22) +
        fmt(r.ex).padStart(12) + '  ' +
        fmt(r.mg).padStart(15) + '  ' +
        fmt(r.pn).padStart(11) + '  ' +
        pct(r.ex, r.pn).padStart(13) + '  ' +
        pct(r.mg, r.pn).padStart(15)
      );
    }
    console.log('=================================================================================================');

    const gapInclGst = pinnacleInclGst.total - (margBaseMo + margContMo) * 1.15;
    const recoveredInclGst = ((exactBaseMo + exactContMo) - (margBaseMo + margContMo)) * 1.15;
    console.log(`\nGap (Pinnacle − FFCalc marginals) = ${fmt(gapInclGst)}/mo incl GST`);
    console.log(`Recovered by switching to JOINT cell counts: ${fmt(recoveredInclGst)}/mo incl GST\n`);
  });

  it('joint-cell mode reconciles to Pinnacle within ±0.05% on the total', () => {
    const totalExclGst = exactBaseMo + exactContMo;
    const expected = pinnacleInclGst.total / 1.15;
    const gap = Math.abs(totalExclGst - expected) / expected;
    expect(gap).toBeLessThan(0.0005);
  });

  it('marginals mode underpays by 2-3% on this practice (independence assumption)', () => {
    // The point of this assertion is to lock in that the gap exists and explain
    // it. If we ever fix mixFromMarginals (e.g. by accepting CSC-by-age-band
    // sub-marginals), this test should be updated to expect ≤ 0.5% instead.
    const totalExclGst = margBaseMo + margContMo;
    const expected = pinnacleInclGst.total / 1.15;
    const gap = (expected - totalExclGst) / expected;
    expect(gap).toBeGreaterThan(0.02);
    expect(gap).toBeLessThan(0.03);
  });
});
