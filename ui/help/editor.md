# Editor

Define a practice's demographics and (optionally) its current PHO offer.

## Using this screen

- Set the practice **name**, **type** (Access / Non-Access — affects First-Level rate), and **zero-fees scheme** (Under-14s for modern, Under-6s for legacy).
- Pick a **demographic input mode** (toggle in the Enrolment & demographics card):
  - **Marginal totals** — fastest. Enter age-band counts plus female / Māori-Pacific / Dep 9-10 / CSC totals. The engine assumes independence between dimensions.
  - **Cross-tab (joint)** — most accurate. Enter the full age × sex × ethnicity × deprivation matrix. Use this when you have the breakdown from Karo and SIA / CarePlus accuracy matters.
- HUHC and CSC are entered as marginals in either mode (they're applied across all cells).
- **Current PHO offer** (collapsible) is optional. Fill it in to enable variance comparisons against the practice's existing arrangement.
- Save returns you to the Register if you're editing an existing practice; for a new practice, Save & open workbench takes you straight to modeling.

## Switching between input modes

- **Marginal → Cross-tab**: cells are auto-seeded from your marginals (assuming independence). Adjust cells from there.
- **Cross-tab → Marginal**: marginals are recomputed from your cells (lossless aggregation). Your work is preserved either way.

## Connections

- Save → **Register** (existing practice) or **Workbench** (new practice).
- **Register** (back) — discard changes.
