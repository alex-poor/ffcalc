# FFCalc v0.4.1

## Added

- **Management Services funding** on the Network screen — the PHO-level, tiered per-capita stream from Te Whatu Ora s.8. Annual dollars, tier band, and per-person effective rate are shown with a full breakdown; the amount is folded into the network gross + retained totals. Includes a toggle for "Management Services Plan approved" (Tier 1 prerequisite). Does not affect individual practice figures.

## Fixed

- Release notes in the in-app update modal now render formatting (headings, bullets, bold) instead of raw markdown text.

---

If you're upgrading from **v0.3.2**, v0.4.0 also added:

## Network view

Portfolio-wide rollup across every practice, with a single network pass-through slider. Shows total enrolled, gross PHO revenue, retained $, and offered $ at thePHO level, plus a per-practice contribution table with variance against each practice's recorded baseline.

## Offer vs Current PHO comparison

A new mode on the Comparison screen showing one practice's current-PHO baseline alongside thePHO's offer, per stream. One-click PDF export formatted for sharing with practices.

## Cross-tab demographic input

On the practice editor, flip the Demographic breakdown card to cross-tab mode to enter exact age × sex × ethnicity × deprivation counts (48 cells per practice). Marginal mode still works unchanged; the engine picks the joint path automatically when cross-tab data is present.

## Quality-of-life

- Clearer **Edit practice** buttons on the register and in the workbench header.
- Default pass-through raised from 85% to 90%.
- PDF export uses jsPDF bundled offline — no internet required.
