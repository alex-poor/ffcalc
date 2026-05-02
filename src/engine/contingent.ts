import type { PopulationMix, StreamResult, AgeBand, Gender } from '../types.js';
import ratesJson from '../rates/contingent.json' with { type: 'json' };

interface ContingentRow { ageBand: AgeBand; gender: Gender; rate: number; }

const rateIndex: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const r of ratesJson.rates as ContingentRow[]) {
    m.set(`${r.ageBand}|${r.gender}`, r.rate);
  }
  return m;
})();

export function calculateContingent(mix: PopulationMix): StreamResult {
  let total = 0;
  for (const cell of mix.cells) {
    if (cell.count === 0) continue;
    const rate = rateIndex.get(`${cell.ageBand}|${cell.gender}`);
    if (rate === undefined) throw new Error(`No contingent rate for: ${cell.ageBand}|${cell.gender}`);
    total += rate * cell.count;
  }
  return {
    stream: 'contingent',
    totalAnnual: total,
    effectiveDate: ratesJson.effectiveDate,
    source: ratesJson.source,
    notes: ['Te Whatu Ora→PHO gross. PHO may retain a portion as performance link.'],
  };
}
