export type AgeBand = '0-4' | '5-14' | '15-24' | '25-44' | '45-64' | '65+';
export type Gender = 'F' | 'M';
export type DepBand = 'dep1-8' | 'dep9-10';
export type EthnicityGroup = 'maori-pacific' | 'other';
export type YN = 'Y' | 'N';
export type PracticeType = 'Access' | 'Non-Access';

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
}

export type StreamId = 'first-level' | 'hop' | 'sia' | 'careplus';

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
