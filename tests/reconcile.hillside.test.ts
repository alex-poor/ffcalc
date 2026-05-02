import { describe, it, expect } from 'vitest';
import { calculateAll } from '../src/engine/calculate.js';
import { mixFromMarginals } from '../src/fromMarginals.js';

// Reconciliation: Hillside Medical Centre, April 2026.
// Source: ProCare "Operational Excellence #2 — Enrolment & Funding Summary"
//         and "Capitation Payment Summary 2026-04".
//
// The Financial Summary surfaces FLS, VLCA, U14, CSC and Contingent amounts
// directly. VLCA = $0 → Non-Access. CSC count is not given; the closest fit
// to the reported $5,203/mo CSC top-up is ~360, which we use here.

const marginals = {
  practiceType: 'Non-Access' as const,
  ageCounts: { '0-4': 63, '5-14': 191, '15-24': 215, '25-44': 480, '45-64': 373, '65+': 252 },
  maoriPacificCount: 401,   // Māori 135 + Pacific 266
  dep9to10Count: 247,       // Quintile 5
  cscCount: 360,            // back-solved from CSC top-up amount
};

const actualMonthly = {
  flsBase: 24282,
  u14: 2174,
  cscSubsidy: 5203,
  contingent: 1457,
};

describe('Reconciliation: Hillside Medical Centre (April 2026, monthly, excl GST)', () => {
  const mix = mixFromMarginals(marginals);
  const result = calculateAll(mix);
  const eng = {
    firstLevel: result.streams.find(s => s.stream === 'first-level')!.totalAnnual / 12,
    u14:        result.streams.find(s => s.stream === 'u14')!.totalAnnual / 12,
    contingent: result.streams.find(s => s.stream === 'contingent')!.totalAnnual / 12,
  };

  it('prints reconciliation table', () => {
    const fmt = (n: number) => '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (e: number, a: number) => a === 0 ? '—' : `${((e - a) / a * 100).toFixed(1)}%`;

    const rows = [
      { label: 'First-Level + CSC',  eng: eng.firstLevel, act: actualMonthly.flsBase + actualMonthly.cscSubsidy },
      { label: 'U14 (ZF14)',         eng: eng.u14,        act: actualMonthly.u14 },
      { label: 'Contingent',         eng: eng.contingent, act: actualMonthly.contingent },
    ];
    console.log('\n==================================================================================');
    console.log('Hillside reconciliation — April 2026 — 1,574 patients, Non-Access, HUHC=0, CSC=360');
    console.log('==================================================================================');
    console.log('Stream                                      Engine/mo       Actual/mo       Δ%');
    console.log('----------------------------------------------------------------------------------');
    for (const r of rows) {
      console.log(r.label.padEnd(44) + fmt(r.eng).padStart(13) + '   ' + fmt(r.act).padStart(13) + '   ' + pct(r.eng, r.act).padStart(7));
    }
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

  it('Contingent reconciles within ±3% of actual (≈100% pass-through at this practice)', () => {
    const gap = Math.abs(eng.contingent - actualMonthly.contingent) / actualMonthly.contingent;
    expect(gap).toBeLessThan(0.03);
  });
});
