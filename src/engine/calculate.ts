import type { PopulationMix, FundingResult } from '../types.js';
import { calculateFirstLevel } from './firstLevel.js';
import { calculateZeroFees } from './u14.js';
import { calculateContingent } from './contingent.js';
import { calculateHop } from './hop.js';
import { calculateSia } from './sia.js';
import { calculateCareplus } from './careplus.js';

export function calculateAll(mix: PopulationMix): FundingResult {
  const streams = [
    calculateFirstLevel(mix),
    calculateZeroFees(mix),
    calculateContingent(mix),
    calculateHop(mix),
    calculateSia(mix),
    calculateCareplus(mix),
  ];
  const totalAnnual = streams.reduce((sum, s) => sum + s.totalAnnual, 0);
  return { streams, totalAnnual };
}
