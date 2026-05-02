# FFCalc

Interactive calculator a NZ PHO uses with practices to estimate practice income under a bulk-funding arrangement. Built for **thePHO**.

The engine ingests aggregated practice demographics and returns Te Whatu Ora → PHO revenue per stream; the UI then layers on per-stream pass-through (retention) sliders so finance staff can model the offer to the practice.

## Funding streams

All rates are taken from the official Te Whatu Ora capitation rates page: https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates. Each rate file (`src/rates/*.json`) carries a `source` and `sourceUrl` linking the relevant section, and the in-app **Rate Reference** screen renders these as clickable "View source" links.

| Stream | Source | Drives |
|---|---|---|
| First-Level Services | s.1 + s.9 (CSC top-up) | Base capitation by age × gender × HUHC × practice type |
| Zero Fees Under-14s | s.11 | Per-patient capitation for enrolled patients aged 0–13 (modern default) |
| Zero Fees Under-6s | s.10 | Alternative scheme to ZF14, mutually exclusive |
| Contingent Capitation | s.13 | Per-patient by age × gender; PHO may retain as a performance link |
| Health Promotion (HOP) | s.4 | By ethnicity × deprivation; HUHC excluded |
| Services to Improve Access (SIA) | s.5 | By age × gender × ethnicity × deprivation; HUHC excluded |
| CarePlus | thePHO schedule (`examples/careplus funding.xlsx`) | By age × gender × deprivation × ethnicity |

Practices toggle between the U14 and U6 schemes in the editor; the engine emits both stream keys for uniform iteration but only the active scheme contributes to the total.

## Reconciliation

Two practices are checked against ProCare / Karo reports under `tests/reconcile.*.test.ts`:

- **Hillside Medical Centre** (April 2026) — First-Level + CSC, U14, and Contingent all reconcile within ±0.5%.
- **Blockhouse Bay Medical Centre** (April 2026) — First-Level + CSC and U14 within ±1.5%; Contingent shows the expected ~15% PHO retention gap (engine = TWO→PHO gross; practice receipts net of "performance-linked" retention).

## Distribution

Tauri-packaged desktop app (Windows .exe, Linux AppImage). Local-only: practice data stays in IndexedDB, no network calls at runtime. Releases are produced by tagging `v*` and pushing — see [.github/workflows/tauri.yml](.github/workflows/tauri.yml).

For deeper UI / data-model context see [brief.md](brief.md).