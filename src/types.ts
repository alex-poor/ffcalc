export type AgeBand = '0-4' | '5-14' | '15-24' | '25-44' | '45-64' | '65+';
export type Gender = 'F' | 'M';
export type DepBand = 'dep1-8' | 'dep9-10';
export type EthnicityGroup = 'maori-pacific' | 'other';
export type YN = 'Y' | 'N';
export type PracticeType = 'Access' | 'Non-Access';
// Practices opt into ONE of the two zero-fees schemes. Most modern practices are on U14.
export type ZeroFeesScheme = 'u6' | 'u14';

export interface PopulationCell {
  ageBand: AgeBand;
  gender: Gender;
  ethnicity: EthnicityGroup;
  depBand: DepBand;
  huhc: YN;
  csc: YN;
  count: number;
}

export interface PopulationMix {
  practiceType: PracticeType;
  cells: PopulationCell[];
  zeroFeesScheme?: ZeroFeesScheme;  // defaults to 'u14' when absent
}

export type StreamId = 'first-level' | 'u6' | 'u14' | 'contingent' | 'hop' | 'sia' | 'careplus';

export interface StreamResult {
  stream: StreamId;
  totalAnnual: number;
  effectiveDate: string;
  source: string;
  notes?: string[];
}

export interface FundingResult {
  streams: StreamResult[];
  totalAnnual: number;
}
