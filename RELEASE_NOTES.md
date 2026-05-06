# FFCalc v0.7.0

## Pricing policy

- **Contingent Capitation is now fixed at 100% pass-through.** thePHO passes through every dollar of Contingent Capitation that Te Whatu Ora pays, matching the existing treatment of First-Level, U14, and U6. The Contingent retention slider is removed everywhere it appeared, and any retention value carried in saved scenarios from earlier releases is overridden to 0% at compute time so legacy data doesn't silently re-introduce retention. Other PHOs (ProCare, Pinnacle) treat this as a "performance-linked" line and retain a portion; thePHO does not.

## Reconciliation

- **Flagstaff Medical Centre (Pinnacle PHO) added as a third reconciliation fixture** in `tests/reconcile.flagstaff.test.ts`. With exact joint cell counts, FFCalc reconciles to the cent ($137,976.34 incl GST = $137,976.34). The same fixture demonstrates that marginals-mode entry can undershoot by 2-3% on age-skewed practices because the independence assumption spreads CSC uniformly across age bands when in reality CSC is heavily concentrated in 65+ patients (where the CSC top-up is largest).

## Notes

- The engine itself is unchanged — the contingent-lock change affects only how the practice's offered amount is computed and displayed in the Workbench, Comparison, and Network views. Gross PHO revenue figures are identical to v0.6.0.
