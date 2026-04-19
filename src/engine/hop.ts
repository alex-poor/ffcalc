import type { PopulationMix, StreamResult, EthnicityGroup, DepBand } from '../types.js';
import ratesJson from '../rates/hop.json' with { type: 'json' };

interface HopRateRow {
  ethnicity: EthnicityGroup;
  depBand: DepBand;
  rate: number;
}

const rateIndex: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const r of ratesJson.rates as HopRateRow[]) {
    m.set(`${r.ethnicity}|${r.depBand}`, r.rate);
  }
  return m;
})();

export function calculateHop(mix: PopulationMix): StreamResult {
  let total = 0;
  for (const cell of mix.cells) {
    if (cell.count === 0) continue;
    if (cell.huhc === 'Y') continue;
    const key = `${cell.ethnicity}|${cell.depBand}`;
    const rate = rateIndex.get(key);
    if (rate === undefined) throw new Error(`No HOP rate for cell: ${key}`);
    total += rate * cell.count;
  }
  return {
    stream: 'hop',
    totalAnnual: total,
    effectiveDate: ratesJson.effectiveDate,
    source: ratesJson.source,
    notes: ['HUHC=Y patients excluded'],
  };
}
