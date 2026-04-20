// engine.js — FFCalc real engine (ports /src/engine to vanilla JS for the browser UI)
// Rate tables mirror /src/rates/*.json exactly. Keep in sync if rates change.

(function () {
  const AGE_BANDS = ['0-4', '5-14', '15-24', '25-44', '45-64', '65+'];

  // --- Rate tables (mirrored from /src/rates) ---

  const FIRST_LEVEL_RATES = [
    { practiceType: 'Access',     ageBand: '0-4',   gender: 'F', huhc: 'N', rate: 546.5244 },
    { practiceType: 'Access',     ageBand: '0-4',   gender: 'F', huhc: 'Y', rate: 737.8764 },
    { practiceType: 'Access',     ageBand: '0-4',   gender: 'M', huhc: 'N', rate: 581.5788 },
    { practiceType: 'Access',     ageBand: '0-4',   gender: 'M', huhc: 'Y', rate: 737.8764 },
    { practiceType: 'Access',     ageBand: '5-14',  gender: 'F', huhc: 'N', rate: 156.2472 },
    { practiceType: 'Access',     ageBand: '5-14',  gender: 'F', huhc: 'Y', rate: 473.1072 },
    { practiceType: 'Access',     ageBand: '5-14',  gender: 'M', huhc: 'N', rate: 146.2500 },
    { practiceType: 'Access',     ageBand: '5-14',  gender: 'M', huhc: 'Y', rate: 473.1072 },
    { practiceType: 'Access',     ageBand: '15-24', gender: 'F', huhc: 'N', rate: 163.5708 },
    { practiceType: 'Access',     ageBand: '15-24', gender: 'F', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Access',     ageBand: '15-24', gender: 'M', huhc: 'N', rate: 90.0240 },
    { practiceType: 'Access',     ageBand: '15-24', gender: 'M', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Access',     ageBand: '25-44', gender: 'F', huhc: 'N', rate: 143.7384 },
    { practiceType: 'Access',     ageBand: '25-44', gender: 'F', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Access',     ageBand: '25-44', gender: 'M', huhc: 'N', rate: 92.9136 },
    { practiceType: 'Access',     ageBand: '25-44', gender: 'M', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Access',     ageBand: '45-64', gender: 'F', huhc: 'N', rate: 196.8732 },
    { practiceType: 'Access',     ageBand: '45-64', gender: 'F', huhc: 'Y', rate: 499.1520 },
    { practiceType: 'Access',     ageBand: '45-64', gender: 'M', huhc: 'N', rate: 147.0420 },
    { practiceType: 'Access',     ageBand: '45-64', gender: 'M', huhc: 'Y', rate: 499.1520 },
    { practiceType: 'Access',     ageBand: '65+',   gender: 'F', huhc: 'N', rate: 339.2724 },
    { practiceType: 'Access',     ageBand: '65+',   gender: 'F', huhc: 'Y', rate: 535.3236 },
    { practiceType: 'Access',     ageBand: '65+',   gender: 'M', huhc: 'N', rate: 292.5840 },
    { practiceType: 'Access',     ageBand: '65+',   gender: 'M', huhc: 'Y', rate: 535.3236 },

    { practiceType: 'Non-Access', ageBand: '0-4',   gender: 'F', huhc: 'N', rate: 546.5244 },
    { practiceType: 'Non-Access', ageBand: '0-4',   gender: 'F', huhc: 'Y', rate: 737.8764 },
    { practiceType: 'Non-Access', ageBand: '0-4',   gender: 'M', huhc: 'N', rate: 581.5788 },
    { practiceType: 'Non-Access', ageBand: '0-4',   gender: 'M', huhc: 'Y', rate: 737.8764 },
    { practiceType: 'Non-Access', ageBand: '5-14',  gender: 'F', huhc: 'N', rate: 140.7084 },
    { practiceType: 'Non-Access', ageBand: '5-14',  gender: 'F', huhc: 'Y', rate: 473.1072 },
    { practiceType: 'Non-Access', ageBand: '5-14',  gender: 'M', huhc: 'N', rate: 133.3536 },
    { practiceType: 'Non-Access', ageBand: '5-14',  gender: 'M', huhc: 'Y', rate: 473.1072 },
    { practiceType: 'Non-Access', ageBand: '15-24', gender: 'F', huhc: 'N', rate: 163.5708 },
    { practiceType: 'Non-Access', ageBand: '15-24', gender: 'F', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Non-Access', ageBand: '15-24', gender: 'M', huhc: 'N', rate: 90.0240 },
    { practiceType: 'Non-Access', ageBand: '15-24', gender: 'M', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Non-Access', ageBand: '25-44', gender: 'F', huhc: 'N', rate: 143.7384 },
    { practiceType: 'Non-Access', ageBand: '25-44', gender: 'F', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Non-Access', ageBand: '25-44', gender: 'M', huhc: 'N', rate: 92.9136 },
    { practiceType: 'Non-Access', ageBand: '25-44', gender: 'M', huhc: 'Y', rate: 455.7468 },
    { practiceType: 'Non-Access', ageBand: '45-64', gender: 'F', huhc: 'N', rate: 196.8732 },
    { practiceType: 'Non-Access', ageBand: '45-64', gender: 'F', huhc: 'Y', rate: 499.1520 },
    { practiceType: 'Non-Access', ageBand: '45-64', gender: 'M', huhc: 'N', rate: 147.0420 },
    { practiceType: 'Non-Access', ageBand: '45-64', gender: 'M', huhc: 'Y', rate: 499.1520 },
    { practiceType: 'Non-Access', ageBand: '65+',   gender: 'F', huhc: 'N', rate: 339.2724 },
    { practiceType: 'Non-Access', ageBand: '65+',   gender: 'F', huhc: 'Y', rate: 535.3236 },
    { practiceType: 'Non-Access', ageBand: '65+',   gender: 'M', huhc: 'N', rate: 292.5840 },
    { practiceType: 'Non-Access', ageBand: '65+',   gender: 'M', huhc: 'Y', rate: 535.3236 },
  ];

  const CSC_TOPUP_RATES = [
    { ageBand: '0-4',   gender: 'F', rate: 0.0000 },
    { ageBand: '0-4',   gender: 'M', rate: 0.0000 },
    { ageBand: '5-14',  gender: 'F', rate: 6.4788 },
    { ageBand: '5-14',  gender: 'M', rate: 6.5028 },
    { ageBand: '15-24', gender: 'F', rate: 95.1024 },
    { ageBand: '15-24', gender: 'M', rate: 57.8040 },
    { ageBand: '25-44', gender: 'F', rate: 132.3036 },
    { ageBand: '25-44', gender: 'M', rate: 145.7160 },
    { ageBand: '45-64', gender: 'F', rate: 263.4684 },
    { ageBand: '45-64', gender: 'M', rate: 270.5916 },
    { ageBand: '65+',   gender: 'F', rate: 347.8368 },
    { ageBand: '65+',   gender: 'M', rate: 371.7516 },
  ];

  const HOP_RATES = [
    { ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 3.0828 },
    { ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 3.5976 },
    { ethnicity: 'other',         depBand: 'dep1-8',  rate: 2.5692 },
    { ethnicity: 'other',         depBand: 'dep9-10', rate: 3.0828 },
  ];

  // SIA: non-MP + dep1-8 = $0, elided; missing lookup treated as 0.
  const SIA_RATES = [
    { ageBand: '0-4',   gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 88.8096 },
    { ageBand: '0-4',   gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 177.6204 },
    { ageBand: '0-4',   gender: 'F', ethnicity: 'other',         depBand: 'dep9-10', rate: 88.8096 },
    { ageBand: '0-4',   gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 93.5028 },
    { ageBand: '0-4',   gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 187.0116 },
    { ageBand: '0-4',   gender: 'M', ethnicity: 'other',         depBand: 'dep9-10', rate: 93.5028 },
    { ageBand: '5-14',  gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 28.1112 },
    { ageBand: '5-14',  gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 56.2224 },
    { ageBand: '5-14',  gender: 'F', ethnicity: 'other',         depBand: 'dep9-10', rate: 28.1112 },
    { ageBand: '5-14',  gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 26.3124 },
    { ageBand: '5-14',  gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 52.6260 },
    { ageBand: '5-14',  gender: 'M', ethnicity: 'other',         depBand: 'dep9-10', rate: 26.3124 },
    { ageBand: '15-24', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 25.9380 },
    { ageBand: '15-24', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 51.8784 },
    { ageBand: '15-24', gender: 'F', ethnicity: 'other',         depBand: 'dep9-10', rate: 25.9380 },
    { ageBand: '15-24', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 14.2764 },
    { ageBand: '15-24', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 28.5540 },
    { ageBand: '15-24', gender: 'M', ethnicity: 'other',         depBand: 'dep9-10', rate: 14.2764 },
    { ageBand: '25-44', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 22.7940 },
    { ageBand: '25-44', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 45.5892 },
    { ageBand: '25-44', gender: 'F', ethnicity: 'other',         depBand: 'dep9-10', rate: 22.7940 },
    { ageBand: '25-44', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 14.7336 },
    { ageBand: '25-44', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 29.4696 },
    { ageBand: '25-44', gender: 'M', ethnicity: 'other',         depBand: 'dep9-10', rate: 14.7336 },
    { ageBand: '45-64', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 31.2192 },
    { ageBand: '45-64', gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 62.4420 },
    { ageBand: '45-64', gender: 'F', ethnicity: 'other',         depBand: 'dep9-10', rate: 31.2192 },
    { ageBand: '45-64', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 23.3184 },
    { ageBand: '45-64', gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 46.6368 },
    { ageBand: '45-64', gender: 'M', ethnicity: 'other',         depBand: 'dep9-10', rate: 23.3184 },
    { ageBand: '65+',   gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 53.8032 },
    { ageBand: '65+',   gender: 'F', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 107.6064 },
    { ageBand: '65+',   gender: 'F', ethnicity: 'other',         depBand: 'dep9-10', rate: 53.8032 },
    { ageBand: '65+',   gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep1-8',  rate: 46.3992 },
    { ageBand: '65+',   gender: 'M', ethnicity: 'maori-pacific', depBand: 'dep9-10', rate: 92.7972 },
    { ageBand: '65+',   gender: 'M', ethnicity: 'other',         depBand: 'dep9-10', rate: 46.3992 },
  ];

  const CAREPLUS_RATES = [
    { ageBand: '0-4',   gender: 'F', depBand: 'dep1-8',  ethnicity: 'other',         rate: 4.337694 },
    { ageBand: '0-4',   gender: 'F', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 6.6511308 },
    { ageBand: '0-4',   gender: 'F', depBand: 'dep9-10', ethnicity: 'other',         rate: 6.3619512 },
    { ageBand: '0-4',   gender: 'F', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 7.5186696 },
    { ageBand: '0-4',   gender: 'M', depBand: 'dep1-8',  ethnicity: 'other',         rate: 4.9160532 },
    { ageBand: '0-4',   gender: 'M', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 5.783592 },
    { ageBand: '0-4',   gender: 'M', depBand: 'dep9-10', ethnicity: 'other',         rate: 5.4944124 },
    { ageBand: '0-4',   gender: 'M', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 8.9645676 },
    { ageBand: '5-14',  gender: 'F', depBand: 'dep1-8',  ethnicity: 'other',         rate: 3.1809756 },
    { ageBand: '5-14',  gender: 'F', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 3.7593348 },
    { ageBand: '5-14',  gender: 'F', depBand: 'dep9-10', ethnicity: 'other',         rate: 3.4701552 },
    { ageBand: '5-14',  gender: 'F', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 4.0485144 },
    { ageBand: '5-14',  gender: 'M', depBand: 'dep1-8',  ethnicity: 'other',         rate: 2.0242572 },
    { ageBand: '5-14',  gender: 'M', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 2.6026164 },
    { ageBand: '5-14',  gender: 'M', depBand: 'dep9-10', ethnicity: 'other',         rate: 2.3134368 },
    { ageBand: '5-14',  gender: 'M', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 4.6268736 },
    { ageBand: '15-24', gender: 'F', depBand: 'dep1-8',  ethnicity: 'other',         rate: 4.0485144 },
    { ageBand: '15-24', gender: 'F', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 9.5429268 },
    { ageBand: '15-24', gender: 'F', depBand: 'dep9-10', ethnicity: 'other',         rate: 7.22949 },
    { ageBand: '15-24', gender: 'F', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 9.8321064 },
    { ageBand: '15-24', gender: 'M', depBand: 'dep1-8',  ethnicity: 'other',         rate: 1.445898 },
    { ageBand: '15-24', gender: 'M', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 4.6268736 },
    { ageBand: '15-24', gender: 'M', depBand: 'dep9-10', ethnicity: 'other',         rate: 4.337694 },
    { ageBand: '15-24', gender: 'M', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 4.9160532 },
    { ageBand: '25-44', gender: 'F', depBand: 'dep1-8',  ethnicity: 'other',         rate: 6.9403104 },
    { ageBand: '25-44', gender: 'F', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 10.9888248 },
    { ageBand: '25-44', gender: 'F', depBand: 'dep9-10', ethnicity: 'other',         rate: 7.5186696 },
    { ageBand: '25-44', gender: 'F', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 12.4347228 },
    { ageBand: '25-44', gender: 'M', depBand: 'dep1-8',  ethnicity: 'other',         rate: 3.7593348 },
    { ageBand: '25-44', gender: 'M', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 8.9645676 },
    { ageBand: '25-44', gender: 'M', depBand: 'dep9-10', ethnicity: 'other',         rate: 4.6268736 },
    { ageBand: '25-44', gender: 'M', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 10.4104656 },
    { ageBand: '45-64', gender: 'F', depBand: 'dep1-8',  ethnicity: 'other',         rate: 13.8806208 },
    { ageBand: '45-64', gender: 'F', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 39.9067848 },
    { ageBand: '45-64', gender: 'F', depBand: 'dep9-10', ethnicity: 'other',         rate: 24.580266 },
    { ageBand: '45-64', gender: 'F', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 40.1959644 },
    { ageBand: '45-64', gender: 'M', depBand: 'dep1-8',  ethnicity: 'other',         rate: 17.350776 },
    { ageBand: '45-64', gender: 'M', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 45.9795564 },
    { ageBand: '45-64', gender: 'M', depBand: 'dep9-10', ethnicity: 'other',         rate: 26.8937028 },
    { ageBand: '45-64', gender: 'M', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 48.2929932 },
    { ageBand: '65+',   gender: 'F', depBand: 'dep1-8',  ethnicity: 'other',         rate: 53.2090464 },
    { ageBand: '65+',   gender: 'F', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 84.4404432 },
    { ageBand: '65+',   gender: 'F', depBand: 'dep9-10', ethnicity: 'other',         rate: 64.7762304 },
    { ageBand: '65+',   gender: 'F', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 97.7427048 },
    { ageBand: '65+',   gender: 'M', depBand: 'dep1-8',  ethnicity: 'other',         rate: 61.3060752 },
    { ageBand: '65+',   gender: 'M', depBand: 'dep1-8',  ethnicity: 'maori-pacific', rate: 107.5748112 },
    { ageBand: '65+',   gender: 'M', depBand: 'dep9-10', ethnicity: 'other',         rate: 71.4273612 },
    { ageBand: '65+',   gender: 'M', depBand: 'dep9-10', ethnicity: 'maori-pacific', rate: 118.563636 },
  ];

  const RATES_META = {
    firstLevel: {
      name: 'First-Level Services', shortName: 'First-Level',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates',
      notes: 'Age × gender × practice type × HUHC. Non-Access CSC holders receive an additional top-up.',
    },
    hop: {
      name: 'Health Promotion (HOP)', shortName: 'HOP',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates',
      notes: 'Per-enrolled rate by ethnicity × deprivation band. HUHC holders excluded.',
    },
    sia: {
      name: 'Services to Improve Access (SIA)', shortName: 'SIA',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates',
      notes: 'Age × gender × ethnicity × deprivation. Non-Māori/Pacific in low-dep areas pay $0. HUHC excluded.',
    },
    careplus: {
      name: 'CarePlus', shortName: 'CarePlus',
      effective: '1 July 2025',
      source: 'thePHO CarePlus schedule',
      sourceUrl: '#',
      notes: "thePHO's per-enrolled schedule by age × gender × Quintile-5 × Māori/Pacific.",
    },
  };

  // --- Indexes ---
  const idx = { firstLevel: new Map(), csc: new Map(), hop: new Map(), sia: new Map(), careplus: new Map() };
  FIRST_LEVEL_RATES.forEach(r => idx.firstLevel.set(`${r.practiceType}|${r.ageBand}|${r.gender}|${r.huhc}`, r.rate));
  CSC_TOPUP_RATES.forEach(r => idx.csc.set(`${r.ageBand}|${r.gender}`, r.rate));
  HOP_RATES.forEach(r => idx.hop.set(`${r.ethnicity}|${r.depBand}`, r.rate));
  SIA_RATES.forEach(r => idx.sia.set(`${r.ageBand}|${r.gender}|${r.ethnicity}|${r.depBand}`, r.rate));
  CAREPLUS_RATES.forEach(r => idx.careplus.set(`${r.ageBand}|${r.gender}|${r.depBand}|${r.ethnicity}`, r.rate));

  function normalisePracticeType(t) { return t === 'Access' ? 'Access' : 'Non-Access'; }
  function clamp01(x) { return !isFinite(x) || x < 0 ? 0 : x > 1 ? 1 : x; }

  function compute(practice) {
    const practiceType = normalisePracticeType(practice.practiceType);
    const bands = practice.ageCounts || {};
    const total = AGE_BANDS.reduce((s, b) => s + (bands[b] || 0), 0);
    if (total === 0) return emptyResult();

    const pF = clamp01((practice.femaleCount ?? total * 0.5) / total);
    const pMP = clamp01((practice.maoriPacificCount || 0) / total);
    const pDep910 = clamp01((practice.dep9to10Count || 0) / total);
    const pHuhc = clamp01((practice.huhcCount || 0) / total);
    const pCsc = clamp01((practice.cscCount || 0) / total);

    let flTotal = 0, hopTotal = 0, siaTotal = 0, cpTotal = 0;
    const flCells = {}, hopCells = {}, siaCells = {}, cpCells = {};

    for (const ab of AGE_BANDS) {
      const ageCount = bands[ab] || 0;
      if (ageCount === 0) continue;

      for (const g of ['F', 'M']) {
        const pG = g === 'F' ? pF : 1 - pF;
        if (pG === 0) continue;
        const agCount = ageCount * pG;

        // First-Level: walk all four (HUHC × CSC) joint slices to apply base + top-up correctly.
        for (const huhc of ['N', 'Y']) {
          const pH = huhc === 'Y' ? pHuhc : 1 - pHuhc;
          if (pH === 0) continue;
          for (const csc of ['N', 'Y']) {
            const pC = csc === 'Y' ? pCsc : 1 - pCsc;
            if (pC === 0) continue;
            const slice = agCount * pH * pC;
            const base = idx.firstLevel.get(`${practiceType}|${ab}|${g}|${huhc}`) || 0;
            let amt = slice * base;
            if (practiceType === 'Non-Access' && csc === 'Y') {
              amt += slice * (idx.csc.get(`${ab}|${g}`) || 0);
            }
            flTotal += amt;
          }
        }

        // Aggregated FL breakdown cell (one row per age × gender)
        const flLabel = `${ab} · ${g === 'F' ? 'Female' : 'Male'}`;
        const blendedBase =
          (idx.firstLevel.get(`${practiceType}|${ab}|${g}|N`) || 0) * (1 - pHuhc) +
          (idx.firstLevel.get(`${practiceType}|${ab}|${g}|Y`) || 0) * pHuhc;
        const cscAddon = practiceType === 'Non-Access' ? (idx.csc.get(`${ab}|${g}`) || 0) * pCsc : 0;
        const blended = blendedBase + cscAddon;
        flCells[flLabel] = { label: flLabel, count: agCount, rate: blended, amount: agCount * blended };

        const agNonHuhc = agCount * (1 - pHuhc);

        for (const eth of ['maori-pacific', 'other']) {
          const pE = eth === 'maori-pacific' ? pMP : 1 - pMP;
          if (pE === 0) continue;
          for (const dep of ['dep1-8', 'dep9-10']) {
            const pD = dep === 'dep9-10' ? pDep910 : 1 - pDep910;
            if (pD === 0) continue;

            const hopRate = idx.hop.get(`${eth}|${dep}`) || 0;
            const hopContrib = agNonHuhc * pE * pD * hopRate;
            hopTotal += hopContrib;
            const hopLabel = `${eth === 'maori-pacific' ? 'Māori/Pacific' : 'Other'} · ${dep === 'dep9-10' ? 'Dep 9-10' : 'Dep 1-8'}`;
            if (!hopCells[hopLabel]) hopCells[hopLabel] = { label: hopLabel, count: 0, rate: hopRate, amount: 0 };
            hopCells[hopLabel].count += agNonHuhc * pE * pD;
            hopCells[hopLabel].amount += hopContrib;

            const siaRate = idx.sia.get(`${ab}|${g}|${eth}|${dep}`) || 0;
            const siaContrib = agNonHuhc * pE * pD * siaRate;
            siaTotal += siaContrib;
            const siaLabel = `${ab} · ${eth === 'maori-pacific' ? 'M/P' : 'Other'}`;
            if (!siaCells[siaLabel]) siaCells[siaLabel] = { label: siaLabel, count: 0, amount: 0, _wRate: 0, _w: 0 };
            siaCells[siaLabel].count += agNonHuhc * pE * pD;
            siaCells[siaLabel].amount += siaContrib;
            siaCells[siaLabel]._wRate += siaRate * agNonHuhc * pE * pD;
            siaCells[siaLabel]._w += agNonHuhc * pE * pD;

            const cpRate = idx.careplus.get(`${ab}|${g}|${dep}|${eth}`) || 0;
            const cpContrib = agCount * pE * pD * cpRate;
            cpTotal += cpContrib;
            const cpLabel = `${ab} · ${eth === 'maori-pacific' ? 'M/P' : 'Other'}`;
            if (!cpCells[cpLabel]) cpCells[cpLabel] = { label: cpLabel, count: 0, amount: 0, _wRate: 0, _w: 0 };
            cpCells[cpLabel].count += agCount * pE * pD;
            cpCells[cpLabel].amount += cpContrib;
            cpCells[cpLabel]._wRate += cpRate * agCount * pE * pD;
            cpCells[cpLabel]._w += agCount * pE * pD;
          }
        }
      }
    }

    const finishCells = (obj, weighted) => {
      const arr = Object.values(obj).map(c => {
        if (weighted) c.rate = c._w > 0 ? c._wRate / c._w : 0;
        delete c._wRate; delete c._w;
        return c;
      });
      arr.sort((a, b) => b.amount - a.amount);
      return arr;
    };

    return {
      totalPatients: total,
      streams: {
        firstLevel: { total: flTotal, cells: finishCells(flCells, false),  ...RATES_META.firstLevel },
        hop:        { total: hopTotal, cells: finishCells(hopCells, false), ...RATES_META.hop },
        sia:        { total: siaTotal, cells: finishCells(siaCells, true),  ...RATES_META.sia },
        careplus:   { total: cpTotal,  cells: finishCells(cpCells, true),   ...RATES_META.careplus },
      },
      grandTotal: flTotal + hopTotal + siaTotal + cpTotal,
    };
  }

  function emptyResult() {
    return {
      totalPatients: 0,
      streams: {
        firstLevel: { total: 0, cells: [], ...RATES_META.firstLevel },
        hop:        { total: 0, cells: [], ...RATES_META.hop },
        sia:        { total: 0, cells: [], ...RATES_META.sia },
        careplus:   { total: 0, cells: [], ...RATES_META.careplus },
      },
      grandTotal: 0,
    };
  }

  // --- Seed practices (fictional NZ) ---
  const SEED_PRACTICES = [
    {
      id: 'p-manukau-heights', name: 'Manukau Heights Medical', practiceType: 'Access',
      ageCounts: { '0-4': 612, '5-14': 1488, '15-24': 1720, '25-44': 3210, '45-64': 2604, '65+': 1366 },
      femaleCount: 5720, maoriPacificCount: 6120, dep9to10Count: 8840, huhcCount: 0, cscCount: 3780,
      baseline: { firstLevel: 1730000, hop: 35000, sia: 580000, careplus: 320000 },
      modified: Date.now() - 1000 * 60 * 60 * 2, created: Date.now() - 1000 * 60 * 60 * 24 * 14,
    },
    {
      id: 'p-hataitai', name: 'Hataitai Family Doctors', practiceType: 'Non-Access',
      ageCounts: { '0-4': 208, '5-14': 492, '15-24': 612, '25-44': 1440, '45-64': 1320, '65+': 880 },
      femaleCount: 2582, maoriPacificCount: 430, dep9to10Count: 280, huhcCount: 0, cscCount: 410,
      baseline: { firstLevel: 820000, hop: 14500, sia: 62000, careplus: 168000 },
      modified: Date.now() - 1000 * 60 * 60 * 24, created: Date.now() - 1000 * 60 * 60 * 24 * 21,
    },
    {
      id: 'p-te-awamutu', name: 'Te Awamutu Health Centre', practiceType: 'Non-Access',
      ageCounts: { '0-4': 388, '5-14': 880, '15-24': 920, '25-44': 2180, '45-64': 2420, '65+': 1812 },
      femaleCount: 4360, maoriPacificCount: 1940, dep9to10Count: 2610, huhcCount: 0, cscCount: 1280,
      baseline: null,
      modified: Date.now() - 1000 * 60 * 60 * 24 * 6, created: Date.now() - 1000 * 60 * 60 * 24 * 32,
    },
  ];

  // Practice-agnostic pass-through presets. `retention` = % the PHO retains per stream.
  const SEED_TEMPLATES = [
    { id: 't-generous',    name: 'Generous — 95% pass-through',   retention: { firstLevel: 5,  hop: 5,  sia: 5,  careplus: 5  } },
    { id: 't-flat-90',     name: 'Flat — 90% pass-through',       retention: { firstLevel: 10, hop: 10, sia: 10, careplus: 10 } },
    { id: 't-base-85',     name: 'Base — 85% pass-through',       retention: { firstLevel: 15, hop: 15, sia: 15, careplus: 15 } },
    { id: 't-aggressive',  name: 'Aggressive retain — 75%',       retention: { firstLevel: 25, hop: 25, sia: 25, careplus: 25 } },
  ];

  const SEED_SCENARIOS = [
    { id: 's-manukau-base',       practiceId: 'p-manukau-heights', name: 'Base offer — 85% pass-through',
      retention: { firstLevel: 15, hop: 15, sia: 15, careplus: 15 }, created: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 's-manukau-aggressive', practiceId: 'p-manukau-heights', name: 'Aggressive retain — 75% pass-through',
      retention: { firstLevel: 25, hop: 25, sia: 25, careplus: 25 }, created: Date.now() - 1000 * 60 * 60 },
    { id: 's-hataitai-base',      practiceId: 'p-hataitai',        name: 'Hataitai base — 88% pass-through',
      retention: { firstLevel: 12, hop: 12, sia: 12, careplus: 12 }, created: Date.now() - 1000 * 60 * 60 * 24 },
  ];

  // --- Format helpers ---
  function fmtCurrency(n, opts = {}) {
    const { decimals = 0, compact = false } = opts;
    if (!isFinite(n)) return '—';
    if (compact && Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
    if (compact && Math.abs(n) >= 10_000) return '$' + (n / 1000).toFixed(1) + 'k';
    return '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function fmtCurrencySigned(n, opts = {}) {
    const s = fmtCurrency(Math.abs(n), opts);
    return n >= 0 ? '+' + s : '−' + s;
  }
  function fmtNumber(n, decimals = 0) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-NZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function fmtPct(n, decimals = 0) { return (n * 100).toFixed(decimals) + '%'; }
  function fmtDate(ts) {
    const d = new Date(ts), now = Date.now(), diff = now - ts;
    if (diff < 1000 * 60) return 'just now';
    if (diff < 1000 * 60 * 60) return Math.floor(diff / (1000 * 60)) + ' min ago';
    if (diff < 1000 * 60 * 60 * 24) return Math.floor(diff / (1000 * 60 * 60)) + ' hr ago';
    if (diff < 1000 * 60 * 60 * 24 * 7) return Math.floor(diff / (1000 * 60 * 60 * 24)) + ' days ago';
    return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  Object.assign(window, {
    AGE_BANDS,
    FIRST_LEVEL_RATES, CSC_TOPUP_RATES, HOP_RATES, SIA_RATES, CAREPLUS_RATES,
    RATES_META,
    ffCompute: compute,
    SEED_PRACTICES, SEED_SCENARIOS, SEED_TEMPLATES,
    fmtCurrency, fmtCurrencySigned, fmtNumber, fmtPct, fmtDate,
  });
})();
