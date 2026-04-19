import type {
  PopulationMix, PopulationCell, AgeBand, Gender, EthnicityGroup, DepBand, YN, PracticeType,
} from './types.js';

export interface PopulationMarginals {
  practiceType: PracticeType;
  ageCounts: Record<AgeBand, number>;
  femaleCount?: number;
  maoriPacificCount: number;
  dep9to10Count: number;
  huhcCount?: number;
  cscCount: number;
}

const AGE_BANDS: AgeBand[] = ['0-4', '5-14', '15-24', '25-44', '45-64', '65+'];
const GENDERS: Gender[] = ['F', 'M'];
const ETHNICITIES: EthnicityGroup[] = ['maori-pacific', 'other'];
const DEP_BANDS: DepBand[] = ['dep9-10', 'dep1-8'];
const YNS: YN[] = ['Y', 'N'];

export function mixFromMarginals(m: PopulationMarginals): PopulationMix {
  const total = AGE_BANDS.reduce((s, a) => s + (m.ageCounts[a] ?? 0), 0);
  if (total === 0) return { practiceType: m.practiceType, cells: [] };

  const pFemale = (m.femaleCount ?? total * 0.5) / total;
  const pMP = m.maoriPacificCount / total;
  const pDep910 = m.dep9to10Count / total;
  const pHuhc = (m.huhcCount ?? 0) / total;
  const pCsc = m.cscCount / total;

  for (const [name, p] of [
    ['femaleCount', pFemale],
    ['maoriPacificCount', pMP],
    ['dep9to10Count', pDep910],
    ['huhcCount', pHuhc],
    ['cscCount', pCsc],
  ] as const) {
    if (p < 0 || p > 1 || Number.isNaN(p)) {
      throw new Error(`${name} fraction out of range [0,1] (got ${p}); check count does not exceed total of ${total}`);
    }
  }

  const cells: PopulationCell[] = [];
  for (const ageBand of AGE_BANDS) {
    const ageCount = m.ageCounts[ageBand] ?? 0;
    if (ageCount <= 0) continue;
    for (const gender of GENDERS) {
      const pG = gender === 'F' ? pFemale : 1 - pFemale;
      if (pG === 0) continue;
      for (const ethnicity of ETHNICITIES) {
        const pE = ethnicity === 'maori-pacific' ? pMP : 1 - pMP;
        if (pE === 0) continue;
        for (const depBand of DEP_BANDS) {
          const pD = depBand === 'dep9-10' ? pDep910 : 1 - pDep910;
          if (pD === 0) continue;
          for (const huhc of YNS) {
            const pH = huhc === 'Y' ? pHuhc : 1 - pHuhc;
            if (pH === 0) continue;
            for (const csc of YNS) {
              const pC = csc === 'Y' ? pCsc : 1 - pCsc;
              if (pC === 0) continue;
              const count = ageCount * pG * pE * pD * pH * pC;
              cells.push({ ageBand, gender, ethnicity, depBand, huhc, csc, count });
            }
          }
        }
      }
    }
  }
  return { practiceType: m.practiceType, cells };
}
