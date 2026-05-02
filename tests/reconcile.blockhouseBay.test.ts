import { describe, it, expect } from 'vitest';
import { calculateAll } from '../src/engine/calculate.js';
import { mixFromMarginals } from '../src/fromMarginals.js';

// Reconciliation: Blockhouse Bay Medical Centre, April 2026
// Source: examples/Blockhouse_Bay_Financial_Comparison_Template.xlsx
//
// Source gives marginal counts only (age × total, plus CSC/MP/Q5 totals). We
// expand under independence via mixFromMarginals, split gender 50/50 and assume
// HUHC=0 (both absent from source). VLCA=$0 on the invoice → Non-Access practice.

const marginals = {
  practiceType: 'Non-Access' as const,
  ageCounts: { '0-4': 197, '5-14': 532, '15-24': 490, '25-44': 1004, '45-64': 1228, '65+': 1108 },
  maoriPacificCount: 524,   // Māori 285 + Pacific 239
  dep9to10Count: 411,       // Quintile 5
  cscCount: 1035,
};

const actualMonthly = {
  flsBase: 77129.96,        // Karo "Monthly First Level Services"
  u14: 6273.00,             // Karo labels this "Under-6 capitation supplement" (legacy label) — actually ZF14
  cscSubsidy: 18561.98,     // CSC top-up
  contingent: 4035.27,      // Karo "Performance-linked contingent capitation"
  careplus: 6616.43,
  hop: 608.66,
  sia: 1545.92,
};

describe('Reconciliation: Blockhouse Bay Medical Centre (April 2026, monthly, excl GST)', () => {
  const mix = mixFromMarginals(marginals);
  const result = calculateAll(mix);
  const eng = {
    firstLevel: result.streams.find(s => s.stream === 'first-level')!.totalAnnual / 12,
    u14:        result.streams.find(s => s.stream === 'u14')!.totalAnnual / 12,
    contingent: result.streams.find(s => s.stream === 'contingent')!.totalAnnual / 12,
    hop:        result.streams.find(s => s.stream === 'hop')!.totalAnnual / 12,
    sia:        result.streams.find(s => s.stream === 'sia')!.totalAnnual / 12,
    careplus:   result.streams.find(s => s.stream === 'careplus')!.totalAnnual / 12,
  };

  it('prints reconciliation table', () => {
    const fmt = (n: number) => '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (e: number, a: number) => a === 0 ? '—' : `${((e - a) / a * 100).toFixed(1)}%`;

    const rows = [
      { label: 'First-Level + CSC (engine vs FLS+CSC)', eng: eng.firstLevel,  act: actualMonthly.flsBase + actualMonthly.cscSubsidy },
      { label: 'U14 (engine vs Karo "Under-6")',        eng: eng.u14,         act: actualMonthly.u14 },
      { label: 'Contingent (engine = TWO→PHO gross)',   eng: eng.contingent,  act: actualMonthly.contingent },
      { label: 'HOP',      eng: eng.hop,      act: actualMonthly.hop },
      { label: 'SIA',      eng: eng.sia,      act: actualMonthly.sia },
      { label: 'CarePlus', eng: eng.careplus, act: actualMonthly.careplus },
    ];

    console.log('\n==================================================================================');
    console.log('Blockhouse Bay reconciliation — April 2026 — 4,559 patients, Non-Access, HUHC=0');
    console.log('==================================================================================');
    console.log('Stream                                      Engine/mo       Actual/mo       Δ%');
    console.log('----------------------------------------------------------------------------------');
    for (const r of rows) {
      console.log(r.label.padEnd(44) + fmt(r.eng).padStart(13) + '   ' + fmt(r.act).padStart(13) + '   ' + pct(r.eng, r.act).padStart(7));
    }
    console.log('==================================================================================');
    console.log('Note: Contingent / HOP / SIA / CP gap is not an engine bug — engine computes');
    console.log('TWO→PHO revenue; the xlsx shows ProCare→practice distribution (retention covers');
    console.log('PHO operating costs). Contingent retention here is ~15%; performance-linked.');
    console.log('==================================================================================\n');
  });

  it('First-Level + CSC reconciles within ±3% of actual', () => {
    const actualCombined = actualMonthly.flsBase + actualMonthly.cscSubsidy;
    const gap = Math.abs(eng.firstLevel - actualCombined) / actualCombined;
    expect(gap).toBeLessThan(0.03);
  });

  it('U14 reconciles within ±3% of actual', () => {
    const gap = Math.abs(eng.u14 - actualMonthly.u14) / actualMonthly.u14;
    expect(gap).toBeLessThan(0.03);
  });

  it('Contingent gross is at or above practice receipts (PHO retention ≥ 0)', () => {
    // Engine = TWO→PHO; practice receipts are net of any PHO retention.
    // At BHB, ProCare retains ~15% as performance link, so engine should be 0-25% high.
    expect(eng.contingent).toBeGreaterThanOrEqual(actualMonthly.contingent);
    expect(eng.contingent).toBeLessThan(actualMonthly.contingent * 1.25);
  });

  it('cell expansion preserves total patient count (≈ 4559)', () => {
    const totalFromSource = Object.values(marginals.ageCounts).reduce((a, n) => a + n, 0);
    expect(mix.cells.reduce((a, c) => a + c.count, 0)).toBeCloseTo(totalFromSource, 6);
  });
});
