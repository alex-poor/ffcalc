# FFCalc v0.4.0

## New features

- **Network view** — portfolio-wide rollup across every practice with a single network pass-through slider. See total enrolled, gross PHO revenue, retained $, and offered $ at thePHO level, plus a per-practice contribution table with variance against each practice's recorded baseline.
- **Offer vs Current PHO comparison** — a new mode on the Comparison screen that shows one practice's current-PHO baseline alongside thePHO's offer, per stream, with a one-click PDF export formatted for sharing with practices.
- **Cross-tab (joint) demographic input** — on the practice editor, flip the Demographic breakdown card to cross-tab mode to enter exact age × sex × ethnicity × deprivation counts (48 cells per practice). Marginal mode still works unchanged; the engine switches automatically when joint data is present.
- **Edit practice** buttons on the register and in the workbench header jump straight to the editor, replacing the prior ⋯ menu-only path.

## Changes

- Default pass-through is now 90% (was 85%). Existing saved scenarios are unaffected.
- Scenario comparison and Offer vs Current PHO are both reachable from the Comparison tab via the mode toggle in the top-right.
- PDF export uses jsPDF bundled offline — no internet required.
