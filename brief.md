# FFCalc — Web UI Design Brief

## Context

**FFCalc** is an internal tool for **thePHO** (The New Zealand Primary Health Organisation Limited) — a new PHO building a "bulk funding" model. Health NZ | Te Whatu Ora pays capitation to the PHO on behalf of enrolled patients; the PHO then decides how much to pass through to general practices and how much to retain for PHO operations.

The calculator takes a practice's aggregated demographic mix and returns the total Te Whatu Ora revenue it generates, broken down by funding stream. The user then designs the pass-through (pricing) strategy. The tool is **commercially sensitive, local-only, no cloud**.

## Users

- 2-5 PHO finance, strategy, and commercial staff.
- Data-literate, not programmers. Comfortable with spreadsheets.
- Used **before** a bulk-funding agreement is offered to a practice — to model what the deal looks like from both sides.
- Typical session: 10-30 minutes, iterating on one or two practices.

## Brand alignment — thePHO visual identity

Pulled from https://thepho.org.nz/ (CSS bundle, April 2026):

**Primary palette**

| Swatch        | Hex                   | Role                                               |
| ---------------| -----------------------| ----------------------------------------------------|
| Signature red | `#c23d41`             | Primary — buttons, key figures, logo lockup        |
| Soft pink     | `#fad1d4`             | Tints, selected rows, highlight backgrounds        |
| Coral red     | `#ed696e`             | Hover / secondary accent                           |
| Warm amber    | `#f6aa01`             | Sparing accent, warnings                           |
| Mint teal     | `#2dbdb6`             | Rare accent — pair with red for divergent data viz |
| Deep navy     | `#213368`             | Text on light, serious contexts                    |
| Charcoal      | `#3c3c3b`             | Body text                                          |
| Stone grey    | `#e3e1e0`             | Borders, dividers                                  |
| Cloud         | `#f7f7f7` / `#f2f2f2` | Panel backgrounds                                  |

**Typography**
- **All text: Source Sans 3** (Google Fonts). Body 400/500, headings 600/700.
- Use tabular-number variant for dollar values.
- Keep line-height generous (1.5+) — this is a long-read finance tool, not a consumer app.

**Imagery**
- Site uses hero photography of people (teams, leadership portraits) — warm, documentary-style, NZ context.
- Card layouts for news/resources with focus-fill imagery.
- FFCalc is a working tool so imagery is minimal: a small hero only on the empty-state / onboarding view; otherwise data-first.

**Layout motifs**
- **Card-based** content blocks with moderate corner radius (~8px) and soft shadows.
- Horizontal rule dividers between major sections.
- Left-aligned typography, clear hierarchical spacing.

**Bilingual naming (Te Reo Māori | English)**
- thePHO follows the convention "English | Te Reo Māori" with a pipe separator (e.g. "Midland | Te Manawa Taki").
- Mirror this pattern in section headings where natural (e.g. "Funding | Tuku Pūtea"). Do not force translation on every label — prioritise clarity. Use te reo greetings (Tēnā koe) in onboarding/empty states.

**Tone of voice**
- Professional, mission-driven. Plain-language English. Avoid marketing gloss.
- Label copy is short and factual: "First-Level Services", "Retention %", "Offer to practice".

## Data model the UI works with

**Engine input** (per practice):
- `practiceType`: `Access` or `Non-Access` (VLCA / non-VLCA).
- `ageCounts`: counts in six age bands — `0-4`, `5-14`, `15-24`, `25-44`, `45-64`, `65+`.
- `femaleCount` *(optional; default 50% of total)*.
- `maoriPacificCount`: combined Māori + Pacific count.
- `dep9to10Count`: Quintile 5 (high deprivation).
- `huhcCount` *(optional; default 0)*.
- `cscCount`: Community Services Card holders.

**Engine output** (per practice, annualised):
- Four stream totals: `First-Level Capitation`, `Health Promotion (HOP)`, `Services to Improve Access (SIA)`, `CarePlus`.
- Each stream has: amount $, rate-table effective date, source reference.
- Combined total.

**Scenario state** (UI layer, persisted locally):
- Practice record + demographic marginals.
- Per-stream **retention %** slider (0-100%). `practice offer = engine total × (1 − retention)`.
- Optional: current-PHO baseline figures per stream, for variance display.

## Screens

### 1. Practice Register (list) — `/` 

**Purpose:** Home view. All modelled practices at a glance.

**Data shown:**
- Practice name, type (Access / Non-Access), total patient count, last-modified date, est. annual PHO revenue, est. annual practice offer, variance vs current PHO (if available).

**Primary actions:**
- **Add practice** (opens #2).
- **Open practice** (opens #3).
- **Duplicate** / **Delete** (confirm dialog).
- **Import CSV** (opens #6).

**Empty state:** Tēnā koe / welcome copy, "Add your first practice" CTA, one-line explainer of what the tool does.

---

### 2. Practice Editor — `/practice/:id/edit`

**Purpose:** Define a practice's demographic profile.

**Data inputs:**
- Practice name (text).
- Practice type (Access / Non-Access) — radio or segmented toggle. Tooltip explains VLCA.
- Age-band counts — six numeric inputs, shown as a horizontal strip.
- Total patient count — **derived and shown prominently** (sum of age bands).
- Female count (number or % slider; defaults to 50%).
- Māori + Pacific count.
- Quintile-5 count.
- HUHC count (defaults blank = 0, with inline note "HUHC count is usually absent from Karo reports").
- CSC count.
- *(Collapsible)* Current PHO offer per stream — paste-in fields for HOP / SIA / CP / First-Level for variance display later.

**Primary actions:**
- Save.
- Open in workbench (opens #3 with this practice loaded).

**Validation:**
- Each marginal count must be ≤ total; inline red hint + block save when violated.
- Warn (not block) if female count < 40% or > 60%, or if MP + others don't plausibly cover total.

---

### 3. Scenario Workbench — `/practice/:id/workbench` **(primary screen)**

**Purpose:** The working surface. Adjust inputs + retention sliders; watch results update live.

**Layout:** Two-pane split (60/40 on desktop, stacked on narrow screens).

**Left pane — Inputs**
- Practice selector (dropdown, shows current practice).
- All marginal inputs from #2, editable inline.
- Five **retention sliders**, one per stream — `First-Level`, `HOP`, `SIA`, `CarePlus`, plus an **apply to all** master. Sliders 0-100%, default 0%. Show current % prominently next to the slider.
- "Reset retention" button.

**Right pane — Results (live)**
- **Top summary tile:** Annual PHO revenue / Annual retained / Annual offer to practice / Variance vs current PHO.
- **Four stream cards**, one each for First-Level, HOP, SIA, CarePlus:
  - Stream name + effective date (small) + source link.
  - PHO revenue ($, annual + "/mo").
  - Retention % (echoes slider).
  - Practice offer ($, annual + "/mo).
  - Sparkline showing contribution to total.
  - "Show breakdown" expand: collapsed by default; expanded shows the top ~10 contributing cells with counts and rate.
- **Stacked bar chart:** stream contributions to PHO revenue (right-side column).
- **Variance strip (if baseline provided):** for each stream, delta vs current PHO offer (red = worse, green = better, grey = neutral).

**Primary actions:**
- Save as scenario (opens small "name this scenario" dialog).
- Clone current scenario.
- Add to comparison (opens #4 with this scenario selected).
- Export results (CSV download).

**Interaction notes:**
- Every input change must update results within 100 ms — no "Calculate" button.
- Tooltip on every $ value: rate source + effective date + which cells contributed.

---

### 4. Comparison View — `/compare`

**Purpose:** Side-by-side up to 4 scenarios.

**Data shown:**
- Columns: scenarios (up to 4).
- Rows: the four streams + totals.
- Cells: PHO revenue, retention %, practice offer.
- Variance rows: biggest absolute + percentage differences highlighted.
- Scenario metadata row: practice name, effective date, patient count.

**Primary actions:**
- Add scenario to comparison (picker lists all saved scenarios).
- Remove a column.
- Export comparison (CSV, PDF).
- Jump to any column's workbench.

---

### 5. Rate Reference — `/rates`

**Purpose:** Read-only authoritative view of rates the engine uses.

**Data shown:**
- Tabs / segmented nav per stream (First-Level, HOP, SIA, CarePlus, CSC top-up).
- For each: effective date, source URL (Te Whatu Ora or xlsx path), notes from the rate JSON.
- Tabular rate matrix with the stream's dimensions (age, gender, ethnicity, etc.).
- Search / filter by dimension value.

**Primary actions:**
- Copy a row's rate.
- Download rate table as CSV.
- (Future) Upload a new rate table version.

---

### 6. Import / Export — `/data`

**Purpose:** Bring roster extracts in and push results out.

**Data / flow:**
- **Import:**
  - Upload CSV — drag-drop or browse.
  - Column mapping step: mapped columns of the incoming file to the canonical marginals fields.
  - Preview table of practices about to be created.
  - Commit button → practices appear in Register.
- **Export:**
  - Download all scenarios as CSV.
  - Download a comparison as CSV or PDF.
  - Download rate tables as CSV (shortcut to #5's download).

## Cross-cutting UI principles

- **Numbers-forward.** Monospaced / tabular figures for $ values, right-aligned columns, grouped thousands. Finance-tool density, not dashboard theatre.
- **Provenance everywhere.** Every calculated number exposes its inputs and the rate-table effective date on hover/focus.
- **Live recalculation.** No explicit "compute" button anywhere. Input change → UI updates in ≤ 100 ms.
- **Undo / redo** with at least 20 steps, keyboard-accessible.
- **Autosave** on every change; show "saved" indicator in header.
- **Keyboard-first numeric entry.** Tab, Enter, arrow-key increment, and paste of tabular data into age-band strip all supported.
- **Print-friendly.** Workbench and comparison views render cleanly to PDF (single-page scenarios, multi-page comparisons).
- **Accessible.** WCAG AA contrast with the thePHO palette (note: `#c23d41` on white is AA-compliant; `#fad1d4` is decorative-only).
- **Offline.** All data stays in the browser (IndexedDB). App runs from a file:// URL or a Tauri-packaged binary. No network calls at runtime.
- **Bilingual touch-points.** Section headings like "Funding | Tuku Pūtea" where natural; onboarding opens with Tēnā koe. Do not auto-translate body UI.

## Visual tone targets

- **Feel:** clean, clinical-professional, quietly serious. Not playful.
- **Density:** moderate — workbench, not dashboard.
- **Motion:** subtle only — number counters transitioning, slider tracks, card expand/collapse. No decorative animation.
- **Iconography:** single-weight line icons (e.g. Phosphor, Lucide). No filled/cartoon icons.
- **Data viz:** red `#c23d41` as primary series; navy `#213368` as secondary; mint `#2dbdb6` for positive variance; coral `#ed696e` for negative. Avoid rainbow.

## Out of scope (v1)

- Per-patient rosters (input is aggregated demographics only).
- Fee-for-service, Under-6s supplement, Contingent Capitation, SLM, Immunisation Incentive (capitation + flexible funding only, four streams).
- Multi-user collaboration, cloud sync, authentication.
- Historical scenario versioning beyond per-scenario edit history.
- Rate-table editing by end users (read-only in v1; rates are versioned JSON shipped with the app).

## Technical notes for the designer

- State model: **Practice** (demographic record) → **Scenario** (practice snapshot + retention settings). Comparisons are a list of scenario IDs.
- Persistence: IndexedDB (web) or local SQLite (Tauri).
- All calculations client-side via a pure TypeScript library (engine already exists; UI is a thin shell).
- The engine accepts the marginals shape documented above and returns stream totals. The UI never implements funding math itself.
