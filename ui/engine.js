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

  // Zero Fees Under-14s (s.11) — official Te Whatu Ora rates effective 1 July 2025.
  // https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#11-zero-fees-for-under-14s
  const U14_RATES = [
    { ageBand: '0-4',  gender: 'F', rate: 127.9752 },
    { ageBand: '0-4',  gender: 'M', rate: 134.7396 },
    { ageBand: '5-14', gender: 'F', rate:  93.0264 },
    { ageBand: '5-14', gender: 'M', rate:  92.7696 },
  ];

  // Zero Fees Under-6s (s.10) — alternative scheme to U14, mutually exclusive.
  // https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#10-zero-fees-for-under-6s
  const U6_RATES = [
    { ageBand: '0-4',  gender: 'F', rate: 127.9752 },
    { ageBand: '0-4',  gender: 'M', rate: 134.7396 },
    { ageBand: '5-14', gender: 'F', rate:   4.0152 },
    { ageBand: '5-14', gender: 'M', rate:   3.7584 },
  ];

  // Contingent Capitation (s.13) — official Te Whatu Ora rates effective 1 July 2025.
  // https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#13-contingent-capitation-rates
  // Te Whatu Ora pays this gross to the PHO; ProCare describes it as "performance-linked"
  // and may retain a portion before passing to the practice.
  const CONTINGENT_RATES = [
    { ageBand: '0-4',   gender: 'F', rate: 32.7612 },
    { ageBand: '0-4',   gender: 'M', rate: 34.8624 },
    { ageBand: '5-14',  gender: 'F', rate:  8.5020 },
    { ageBand: '5-14',  gender: 'M', rate:  8.0544 },
    { ageBand: '15-24', gender: 'F', rate:  9.8100 },
    { ageBand: '15-24', gender: 'M', rate:  5.3964 },
    { ageBand: '25-44', gender: 'F', rate:  8.6256 },
    { ageBand: '25-44', gender: 'M', rate:  5.5728 },
    { ageBand: '45-64', gender: 'F', rate: 11.8224 },
    { ageBand: '45-64', gender: 'M', rate:  8.8272 },
    { ageBand: '65+',   gender: 'F', rate: 20.4132 },
    { ageBand: '65+',   gender: 'M', rate: 17.6052 },
  ];

  // Management Services (PHO-level, tiered by total enrolment). Paid to the PHO; not passed to practices.
  // Tier 1 additionally requires an approved Management Services Plan.
  // Source: https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#8-management-services
  const MGMT_RATES = {
    tier1_first: 18.3348,       // first 20,000
    tier1_second: 1.0572,       // 20,001–40,000
    tier2_first: 13.0464,       // first 20,000
    tier2_rest: 6.3444,         // 20,001–75,000
    tier3_base: 609870,         // flat for first 75,000
    tier3_perPerson: 7.1244,    // each enrolee above 75,000
  };

  function computeManagementServices(enrolled, hasApprovedPlan) {
    enrolled = Math.max(0, Math.floor(enrolled || 0));
    if (enrolled === 0) return { total: 0, tier: 0, blocked: false, breakdown: [] };

    if (enrolled <= 40000) {
      if (!hasApprovedPlan) {
        return { total: 0, tier: 1, blocked: true, breakdown: [],
          note: 'Tier 1 funding requires an approved Management Services Plan.' };
      }
      const a = Math.min(enrolled, 20000);
      const b = Math.max(0, enrolled - 20000);
      const breakdown = [{ label: 'First 20,000 enrolees', count: a, rate: MGMT_RATES.tier1_first, amount: a * MGMT_RATES.tier1_first }];
      if (b > 0) breakdown.push({ label: `Next ${b.toLocaleString('en-NZ')} enrolees (20,001–40,000)`, count: b, rate: MGMT_RATES.tier1_second, amount: b * MGMT_RATES.tier1_second });
      return { total: breakdown.reduce((s, x) => s + x.amount, 0), tier: 1, blocked: false, breakdown };
    }
    if (enrolled <= 75000) {
      const a = 20000;
      const b = enrolled - 20000;
      const breakdown = [
        { label: 'First 20,000 enrolees', count: a, rate: MGMT_RATES.tier2_first, amount: a * MGMT_RATES.tier2_first },
        { label: `Next ${b.toLocaleString('en-NZ')} enrolees (20,001–75,000)`, count: b, rate: MGMT_RATES.tier2_rest, amount: b * MGMT_RATES.tier2_rest },
      ];
      return { total: breakdown.reduce((s, x) => s + x.amount, 0), tier: 2, blocked: false, breakdown };
    }
    const above = enrolled - 75000;
    const breakdown = [
      { label: 'Base — first 75,000 enrolees', count: 75000, rate: MGMT_RATES.tier3_base / 75000, amount: MGMT_RATES.tier3_base },
      { label: `Over 75,000 (${above.toLocaleString('en-NZ')} enrolees)`, count: above, rate: MGMT_RATES.tier3_perPerson, amount: above * MGMT_RATES.tier3_perPerson },
    ];
    return { total: breakdown.reduce((s, x) => s + x.amount, 0), tier: 3, blocked: false, breakdown };
  }

  const MGMT_META = {
    name: 'Management Services',
    shortName: 'Management',
    effective: '1 July 2025',
    source: 'Te Whatu Ora Capitation Rates, s.8',
    sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#8-management-services',
    notes: 'Per-capita rates paid to the PHO, tiered by total enrolment. Not passed through to practices. Tier 1 requires an approved Management Services Plan.',
  };

  const RATES_META = {
    firstLevel: {
      name: 'First-Level Services', shortName: 'First-Level',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates',
      notes: 'Age × gender × practice type × HUHC. Non-Access CSC holders receive an additional top-up.',
    },
    u14: {
      name: 'Zero Fees for Under 14s', shortName: 'Under-14s',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates s.11',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#11-zero-fees-for-under-14s',
      notes: 'Per-patient capitation by age × gender for enrolled patients aged 0-13. Mutually exclusive with the Under-6s scheme — toggle in the practice editor.',
    },
    u6: {
      name: 'Zero Fees for Under 6s', shortName: 'Under-6s',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates s.10',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#10-zero-fees-for-under-6s',
      notes: 'Alternative to Under-14s for practices that did not opt into the extended scheme. The 0-4 rates are identical between the two; the 5-14 rates are minimal under U6 (just age-5 children).',
    },
    contingent: {
      name: 'Contingent Capitation', shortName: 'Contingent',
      effective: '1 July 2025',
      source: 'Te Whatu Ora Capitation Rates s.13',
      sourceUrl: 'https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates#13-contingent-capitation-rates',
      notes: 'Per-patient capitation by age × gender. thePHO passes this through to practices in full (100%); other PHOs (ProCare, Pinnacle) often retain a portion as "performance-linked" margin. Locked at 100% pass-through across the app — same treatment as First-Level, U14, and U6.',
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
  const idx = {
    firstLevel: new Map(), csc: new Map(),
    u14: new Map(), u6: new Map(), contingent: new Map(),
    hop: new Map(), sia: new Map(), careplus: new Map(),
  };
  FIRST_LEVEL_RATES.forEach(r => idx.firstLevel.set(`${r.practiceType}|${r.ageBand}|${r.gender}|${r.huhc}`, r.rate));
  CSC_TOPUP_RATES.forEach(r => idx.csc.set(`${r.ageBand}|${r.gender}`, r.rate));
  U14_RATES.forEach(r => idx.u14.set(`${r.ageBand}|${r.gender}`, r.rate));
  U6_RATES.forEach(r => idx.u6.set(`${r.ageBand}|${r.gender}`, r.rate));
  CONTINGENT_RATES.forEach(r => idx.contingent.set(`${r.ageBand}|${r.gender}`, r.rate));
  HOP_RATES.forEach(r => idx.hop.set(`${r.ethnicity}|${r.depBand}`, r.rate));
  SIA_RATES.forEach(r => idx.sia.set(`${r.ageBand}|${r.gender}|${r.ethnicity}|${r.depBand}`, r.rate));
  CAREPLUS_RATES.forEach(r => idx.careplus.set(`${r.ageBand}|${r.gender}|${r.depBand}|${r.ethnicity}`, r.rate));

  function normalisePracticeType(t) { return t === 'Access' ? 'Access' : 'Non-Access'; }
  function clamp01(x) { return !isFinite(x) || x < 0 ? 0 : x > 1 ? 1 : x; }

  function compute(practice) {
    const practiceType = normalisePracticeType(practice.practiceType);
    const bands = practice.ageCounts || {};
    const joint = practice.jointCounts || {};
    const useJoint = !!practice.useJoint && Object.values(joint).some(v => v > 0);

    const jointTotal = useJoint ? Object.values(joint).reduce((s, v) => s + (v || 0), 0) : 0;
    const marginalTotal = AGE_BANDS.reduce((s, b) => s + (bands[b] || 0), 0);
    const total = useJoint ? jointTotal : marginalTotal;
    if (total === 0) return emptyResult();

    const pF = clamp01((practice.femaleCount ?? total * 0.5) / total);
    const pMP = clamp01((practice.maoriPacificCount || 0) / total);
    const pDep910 = clamp01((practice.dep9to10Count || 0) / total);
    const pHuhc = clamp01((practice.huhcCount || 0) / total);
    const pCsc = clamp01((practice.cscCount || 0) / total);

    // Count of patients in (ab, g, eth, dep) cell — from jointCounts or derived from marginals.
    const cellCount = (ab, g, eth, dep) => {
      if (useJoint) return joint[`${ab}|${g}|${eth}|${dep}`] || 0;
      const ageCount = bands[ab] || 0;
      const pG = g === 'F' ? pF : 1 - pF;
      const pE = eth === 'maori-pacific' ? pMP : 1 - pMP;
      const pD = dep === 'dep9-10' ? pDep910 : 1 - pDep910;
      return ageCount * pG * pE * pD;
    };
    const ageGenderCount = (ab, g) => {
      if (useJoint) {
        let s = 0;
        for (const eth of ['maori-pacific', 'other']) {
          for (const dep of ['dep1-8', 'dep9-10']) {
            s += joint[`${ab}|${g}|${eth}|${dep}`] || 0;
          }
        }
        return s;
      }
      const pG = g === 'F' ? pF : 1 - pF;
      return (bands[ab] || 0) * pG;
    };

    // Practice-level toggle: which Zero-Fees scheme is the practice on?
    // Defaults to U14 (the modern default; both Hillside and Blockhouse Bay are on U14).
    const zeroFeesScheme = practice.zeroFeesScheme === 'u6' ? 'u6' : 'u14';
    const zfIndex = zeroFeesScheme === 'u14' ? idx.u14 : idx.u6;

    let flTotal = 0, zfTotal = 0, contTotal = 0, hopTotal = 0, siaTotal = 0, cpTotal = 0;
    const flCells = {}, zfCells = {}, contCells = {}, hopCells = {}, siaCells = {}, cpCells = {};

    for (const ab of AGE_BANDS) {
      for (const g of ['F', 'M']) {
        const agCount = ageGenderCount(ab, g);
        if (agCount === 0) continue;

        // Zero-Fees stream (U14 or U6). Age × gender lookup. $0 outside 0-14.
        const zfRate = zfIndex.get(`${ab}|${g}`) || 0;
        if (zfRate > 0) {
          const amt = agCount * zfRate;
          zfTotal += amt;
          const lbl = `${ab} · ${g === 'F' ? 'Female' : 'Male'}`;
          zfCells[lbl] = { label: lbl, count: agCount, rate: zfRate, amount: amt };
        }

        // Contingent — age × gender lookup, no other dimensions.
        const contRate = idx.contingent.get(`${ab}|${g}`) || 0;
        if (contRate > 0) {
          const amt = agCount * contRate;
          contTotal += amt;
          const lbl = `${ab} · ${g === 'F' ? 'Female' : 'Male'}`;
          contCells[lbl] = { label: lbl, count: agCount, rate: contRate, amount: amt };
        }

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

        for (const eth of ['maori-pacific', 'other']) {
          for (const dep of ['dep1-8', 'dep9-10']) {
            const cc = cellCount(ab, g, eth, dep);
            if (cc === 0) continue;
            const ccNonHuhc = cc * (1 - pHuhc);

            const hopRate = idx.hop.get(`${eth}|${dep}`) || 0;
            const hopContrib = ccNonHuhc * hopRate;
            hopTotal += hopContrib;
            const hopLabel = `${eth === 'maori-pacific' ? 'Māori/Pacific' : 'Other'} · ${dep === 'dep9-10' ? 'Dep 9-10' : 'Dep 1-8'}`;
            if (!hopCells[hopLabel]) hopCells[hopLabel] = { label: hopLabel, count: 0, rate: hopRate, amount: 0 };
            hopCells[hopLabel].count += ccNonHuhc;
            hopCells[hopLabel].amount += hopContrib;

            const siaRate = idx.sia.get(`${ab}|${g}|${eth}|${dep}`) || 0;
            const siaContrib = ccNonHuhc * siaRate;
            siaTotal += siaContrib;
            const siaLabel = `${ab} · ${eth === 'maori-pacific' ? 'M/P' : 'Other'}`;
            if (!siaCells[siaLabel]) siaCells[siaLabel] = { label: siaLabel, count: 0, amount: 0, _wRate: 0, _w: 0 };
            siaCells[siaLabel].count += ccNonHuhc;
            siaCells[siaLabel].amount += siaContrib;
            siaCells[siaLabel]._wRate += siaRate * ccNonHuhc;
            siaCells[siaLabel]._w += ccNonHuhc;

            const cpRate = idx.careplus.get(`${ab}|${g}|${dep}|${eth}`) || 0;
            const cpContrib = cc * cpRate;
            cpTotal += cpContrib;
            const cpLabel = `${ab} · ${eth === 'maori-pacific' ? 'M/P' : 'Other'}`;
            if (!cpCells[cpLabel]) cpCells[cpLabel] = { label: cpLabel, count: 0, amount: 0, _wRate: 0, _w: 0 };
            cpCells[cpLabel].count += cc;
            cpCells[cpLabel].amount += cpContrib;
            cpCells[cpLabel]._wRate += cpRate * cc;
            cpCells[cpLabel]._w += cc;
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

    // Zero-fees stream is emitted under whichever key matches the scheme. The other
    // key gets $0 — keeps STREAM_KEYS-driven iterations uniform across practices.
    const zfIsU14 = zeroFeesScheme === 'u14';
    const zfStreamU14 = zfIsU14
      ? { total: zfTotal, cells: finishCells(zfCells, false), ...RATES_META.u14 }
      : { total: 0, cells: [], ...RATES_META.u14 };
    const zfStreamU6 = zfIsU14
      ? { total: 0, cells: [], ...RATES_META.u6 }
      : { total: zfTotal, cells: finishCells(zfCells, false), ...RATES_META.u6 };

    return {
      totalPatients: total,
      zeroFeesScheme,
      streams: {
        firstLevel: { total: flTotal,   cells: finishCells(flCells, false),   ...RATES_META.firstLevel },
        u14:        zfStreamU14,
        u6:         zfStreamU6,
        contingent: { total: contTotal, cells: finishCells(contCells, false), ...RATES_META.contingent },
        hop:        { total: hopTotal,  cells: finishCells(hopCells, false),  ...RATES_META.hop },
        sia:        { total: siaTotal,  cells: finishCells(siaCells, true),   ...RATES_META.sia },
        careplus:   { total: cpTotal,   cells: finishCells(cpCells, true),    ...RATES_META.careplus },
      },
      grandTotal: flTotal + zfTotal + contTotal + hopTotal + siaTotal + cpTotal,
    };
  }

  function emptyResult() {
    return {
      totalPatients: 0,
      zeroFeesScheme: 'u14',
      streams: {
        firstLevel: { total: 0, cells: [], ...RATES_META.firstLevel },
        u14:        { total: 0, cells: [], ...RATES_META.u14 },
        u6:         { total: 0, cells: [], ...RATES_META.u6 },
        contingent: { total: 0, cells: [], ...RATES_META.contingent },
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
  // First-Level is full pass-through (0% retention) by default; PHOs only top-slice if
  // they enable it explicitly under Tweaks → Advanced.
  // Default retention by stream type:
  //   First-Level / U14 / U6 / Contingent — capitation top-ups, fixed at 100% pass-through (thePHO policy).
  //   HOP / SIA / CarePlus — flexible funding; tunable per scenario.
  const SEED_TEMPLATES = [
    { id: 't-generous',    name: 'Generous — 95% pass on flexible',  retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 5,  sia: 5,  careplus: 5  } },
    { id: 't-default-90',  name: 'Default — 90% pass on flexible',   retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 10, sia: 10, careplus: 10 } },
    { id: 't-base-85',     name: 'Conservative — 85% pass',          retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 15, sia: 15, careplus: 15 } },
    { id: 't-aggressive',  name: 'Aggressive retain — 75% pass',     retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 25, sia: 25, careplus: 25 } },
  ];

  const SEED_SCENARIOS = [
    { id: 's-manukau-base',       practiceId: 'p-manukau-heights', name: 'Base offer — 90% pass-through',
      retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 10, sia: 10, careplus: 10 }, created: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 's-manukau-aggressive', practiceId: 'p-manukau-heights', name: 'Aggressive retain — 75% pass on flexible',
      retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 25, sia: 25, careplus: 25 }, created: Date.now() - 1000 * 60 * 60 },
    { id: 's-hataitai-base',      practiceId: 'p-hataitai',        name: 'Hataitai base — 88% pass-through',
      retention: { firstLevel: 0, u14: 0, u6: 0, contingent: 0, hop: 12, sia: 12, careplus: 12 }, created: Date.now() - 1000 * 60 * 60 * 24 },
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
    FIRST_LEVEL_RATES, CSC_TOPUP_RATES, U14_RATES, U6_RATES, CONTINGENT_RATES, HOP_RATES, SIA_RATES, CAREPLUS_RATES,
    RATES_META,
    MGMT_META, MGMT_RATES,
    ffCompute: compute,
    ffComputeManagement: computeManagementServices,
    SEED_PRACTICES, SEED_SCENARIOS, SEED_TEMPLATES,
    fmtCurrency, fmtCurrencySigned, fmtNumber, fmtPct, fmtDate,
  });
})();
