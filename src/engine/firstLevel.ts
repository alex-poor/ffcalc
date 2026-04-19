import type { PopulationMix, StreamResult, AgeBand, Gender, YN, PracticeType } from '../types.js';
import baseJson from '../rates/first-level.json' with { type: 'json' };
import cscJson from '../rates/csc-topup.json' with { type: 'json' };

interface BaseRow { practiceType: PracticeType; ageBand: AgeBand; gender: Gender; huhc: YN; rate: number; }
interface CscRow { ageBand: AgeBand; gender: Gender; rate: number; }

const baseIndex = (() => {
  const m = new Map<string, number>();
  for (const r of baseJson.rates as BaseRow[]) {
    m.set(`${r.practiceType}|${r.ageBand}|${r.gender}|${r.huhc}`, r.rate);
  }
  return m;
})();

const cscIndex = (() => {
  const m = new Map<string, number>();
  for (const r of cscJson.rates as CscRow[]) {
    m.set(`${r.ageBand}|${r.gender}`, r.rate);
  }
  return m;
})();

export function calculateFirstLevel(mix: PopulationMix): StreamResult {
  let total = 0;
  const cscAppliesAtPractice = mix.practiceType === 'Non-Access';

  for (const cell of mix.cells) {
    if (cell.count === 0) continue;

    const baseKey = `${mix.practiceType}|${cell.ageBand}|${cell.gender}|${cell.huhc}`;
    const baseRate = baseIndex.get(baseKey);
    if (baseRate === undefined) throw new Error(`No First-Level rate for: ${baseKey}`);
    total += baseRate * cell.count;

    if (cscAppliesAtPractice && cell.csc === 'Y') {
      const cscRate = cscIndex.get(`${cell.ageBand}|${cell.gender}`);
      if (cscRate === undefined) throw new Error(`No CSC top-up for: ${cell.ageBand}|${cell.gender}`);
      total += cscRate * cell.count;
    }
  }

  const notes: string[] = [`Practice type: ${mix.practiceType}`];
  if (cscAppliesAtPractice) notes.push('CSC top-up applied to all CSC=Y cells');

  return {
    stream: 'first-level',
    totalAnnual: total,
    effectiveDate: baseJson.effectiveDate,
    source: baseJson.source,
    notes,
  };
}
