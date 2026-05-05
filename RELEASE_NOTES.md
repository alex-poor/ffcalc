# FFCalc v0.6.0

A UX-focused release. No engine changes — same numbers, friendlier path through them.

## Added

- **Per-screen help panel.** New Help button (?) in the topbar opens a context-aware side panel with concise guidance for whichever screen you're on (Register, Editor, Workbench, Comparison, Network, Rates, Import & Export). All content embedded in the bundle — works fully offline.
- **First-Level "Unlock" button.** When First-Level pass-through is locked at 100% (the default), the locked row now has a one-click Unlock button that opens Settings → Advanced. No more hunting for the toggle.

## Changed

- **Editor restructured around the marginals/joint toggle.** Previously the age-band strip lived in its own card above the toggle, so it was visible (and editable) even in joint mode where the engine ignores it — two ways to enter the same number, only one of which the engine read. The age strip now lives inside the Marginal-totals branch only. Switching between modes is lossless: joint cells auto-seed from marginals; marginals are recomputed from cells when you switch back.
- **Workbench header tidied.** "Edit practice" moved out of the page title into the right-side button row alongside Save / Open comparison / Export.
- **"Add to comparison" → "Open comparison"** so the label matches what the button does (navigate, not append).
- **Editor save buttons collapsed.** New practice → "Save & open workbench"; existing practice → "Save". One primary action per state.
- **Tweaks panel decluttered.** "Check for updates" duplicate removed — the sidebar footer is now the single source.
- **Terminology standardised on "pass-through"** in user-visible labels and readouts, with "PHO retains X%" tooltips preserved as the inverse view.
- **Topbar icons resized** so Help and Settings sit at the same height as the "All changes saved" pill — discoverable, not lost in the corner.

## Fixed

- **Sidebar version string is now read at runtime from Tauri.** It was a hardcoded literal that didn't get bumped on the 0.5.0 release, so 0.5.0 installs displayed "v0.4.2". From this release onward the displayed version always matches the bundle.

## Notes

- Users currently running 0.5.0 will see "v0.4.2" until they update to this release — the displayed string is baked into the 0.5.0 bundle and can't be fixed retroactively.
