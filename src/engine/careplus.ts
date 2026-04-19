import type { PopulationMix, StreamResult, AgeBand, Gender, DepBand, EthnicityGroup } from '../types.js';
import ratesJson from '../rates/careplus.json' with { type: 'json' };

interface CareplusRateRow {
  ageBand: AgeBand;
  gender: Gender;
  depBand: DepBand;
  ethnicity: EthnicityGroup;
  rate: number;
}

const rateIndex: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const r of ratesJson.rates as CareplusRateRow[]) {
    m.set(`${r.ageBand}|${r.gender}|${r.depBand}|${r.ethnicity}`, r.rate);
  }
  return m;
})();

export function calculateCareplus(mix: PopulationMix): StreamResult {
  let total = 0;
  for (const cell of mix.cells) {
    if (cell.count === 0) continue;
    const key = `${cell.ageBand}|${cell.gender}|${cell.depBand}|${cell.ethnicity}`;
    const rate = rateIndex.get(key);
    if (rate === undefined) {
      throw new Error(`No CarePlus rate for demographic cell: ${key}`);
    }
    total += rate * cell.count;
  }
  return {
    stream: 'careplus',
    totalAnnual: total,
    effectiveDate: ratesJson.effectiveDate,
    source: ratesJson.source,
  };
}
