# FFCalc v0.4.2

## Changed

- **First-Level capitation now passes 100% to practices by default.** The First-Level retention slider is hidden in the Workbench, Network, and saved scenarios — only HOP, SIA, and CarePlus are top-sliced. To re-enable First-Level top-slicing for advanced modelling, tick **Tweaks → Advanced → Allow First-Level top-slice**.
- **Default pass-through across the app is now 90%** for HOP, SIA, and CarePlus (combined with the 100% First-Level pass-through above). Affects new scenarios, new workbench loads, the Network slider, and the Comparison "vs Current PHO" mode.
- **Comparison no longer auto-loads** the most recent saved scenario. The dropdown defaults to the standard pass-through above; pick a saved scenario explicitly if you want one.

## Fixed

- PDF export from Comparison no longer breaks column headers mid-word; column widths and headers reworked to fit cleanly.

## Notes

If you have saved scenarios that include First-Level retention, those values are preserved but ignored while First-Level top-slice is locked off. Toggling the advanced tweak back on restores them.
