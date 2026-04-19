import type { PopulationMix, StreamResult, AgeBand, Gender, EthnicityGroup, DepBand } from '../types.js';
import ratesJson from '../rates/sia.json' with { type: 'json' };

interface SiaRateRow {
  ageBand: AgeBand;
  gender: Gender;
  ethnicity: EthnicityGroup;
  depBand: DepBand;
  rate: number;
}

const rateIndex: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const r of ratesJson.rates as SiaRateRow[]) {
    m.set(`${r.ageBand}|${r.gender}|${r.ethnicity}|${r.depBand}`, r.rate);
  }
  return m;
})();

export function calculateSia(mix: PopulationMix): StreamResult {
  let total = 0;
  for (const cell of mix.cells) {
    if (cell.count === 0) continue;
    if (cell.huhc === 'Y') continue;
    const key = `${cell.ageBand}|${cell.gender}|${cell.ethnicity}|${cell.depBand}`;
    const rate = rateIndex.get(key);
    if (rate === undefined) throw new Error(`No SIA rate for cell: ${key}`);
    total += rate * cell.count;
  }
  return {
    stream: 'sia',
    totalAnnual: total,
    effectiveDate: ratesJson.effectiveDate,
    source: ratesJson.source,
    notes: ['HUHC=Y patients excluded'],
  };
}
