# FFCalc v0.5.0

## Added

- **Three new funding streams** wired into the engine, all sourced from the official Te Whatu Ora capitation rates page:
  - **Zero Fees for Under-14s (ZF14)** — section 11.
  - **Zero Fees for Under-6s (ZF6)** — section 10. Alternative to ZF14; toggle in the practice editor (defaults to U14).
  - **Contingent Capitation** — section 13. Te Whatu Ora pays this gross to the PHO; ProCare and other PHOs may retain a portion as a performance link.
- **Practice editor** now has a Zero-fees scheme selector (Under-14s / Under-6s) alongside the practice-type toggle.
- **Rate Reference screen** picks up U14, U6, and Contingent tables, each with a clickable "View source" link to the Te Whatu Ora section the rates came from.
- **Hillside Medical Centre** added as a second reconciliation fixture in `tests/reconcile.hillside.test.ts`.

## Reconciliation

Validated against ProCare reports (April 2026):

| Stream | Hillside Δ | Blockhouse Bay Δ |
|---|---|---|
| First-Level + CSC | −0.4% | −1.4% |
| U14 | −0.3% | +0.0% |
| Contingent (gross) | −0.5% | +14.9% (PHO retention) |

The Blockhouse Bay contingent gap is **not an engine bug** — engine output is the TWO→PHO gross figure; the practice statement shows receipts net of ProCare's "performance-linked" retention.

## Notes

- Both Hillside and Blockhouse Bay reconcile to the U14 scheme. Note that Karo's older "Under-6 capitation supplement" column label is legacy — many practices on it actually receive U14 amounts.
- The inactive zero-fees scheme is hidden from per-practice views (workbench, comparison, vs-current PDF) so the UI stays compact.
