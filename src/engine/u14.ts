import type { PopulationMix, StreamResult, AgeBand, Gender } from '../types.js';
import u14Json from '../rates/u14.json' with { type: 'json' };
import u6Json from '../rates/u6.json' with { type: 'json' };

interface ZeroFeesRow { ageBand: AgeBand; gender: Gender; rate: number; }

function buildIndex(rows: ZeroFeesRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(`${r.ageBand}|${r.gender}`, r.rate);
  return m;
}

const u14Index = buildIndex(u14Json.rates as ZeroFeesRow[]);
const u6Index = buildIndex(u6Json.rates as ZeroFeesRow[]);

// Calculates the zero-fees stream a practice receives, returning a single
// StreamResult labelled 'u6' or 'u14' depending on which scheme the practice
// has opted into. Defaults to U14 (the modern default) when unset.
export function calculateZeroFees(mix: PopulationMix): StreamResult {
  const scheme = mix.zeroFeesScheme ?? 'u14';
  const useU14 = scheme === 'u14';
  const idx = useU14 ? u14Index : u6Index;
  const meta = useU14 ? u14Json : u6Json;

  let total = 0;
  for (const cell of mix.cells) {
    if (cell.count === 0) continue;
    const rate = idx.get(`${cell.ageBand}|${cell.gender}`);
    if (rate === undefined) continue;
    total += rate * cell.count;
  }

  return {
    stream: useU14 ? 'u14' : 'u6',
    totalAnnual: total,
    effectiveDate: meta.effectiveDate,
    source: meta.source,
    notes: [`Scheme: ${useU14 ? 'Zero Fees Under-14s (s.11)' : 'Zero Fees Under-6s (s.10)'}`],
  };
}
