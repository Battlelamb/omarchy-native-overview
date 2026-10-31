# Changelog

## 0.1.1 — 2026-10-31 (early community pre-release)

- Fix refresh starvation during continuous compositor events and retain refreshes pending during an active query.
- Search before the display cap; validate fresh focus/move membership beyond the first 256 windows.
- Keep the overview open on failed action start/exit/acknowledgement and show translated failure feedback.
- Ignore cancelled verification callbacks after dismissal/reopening, with a regression for normal and failed late completions.
- Add component regressions for these paths (24 component checks pass; not a substitute for native GUI execution).
- Correct the pinned donor source path in NOTICE.md.
- Prepare public install/compatibility documentation and separate validation limits.
- Add a contribution guide, redacted bug-report form and pinned-checkout CI workflow.
- Preserve the existing v0.1.0 tag and the user's installed build; do not silently repoint that release.

Independent source review approved these changes. Hosted component checks passed on the published release-source commit; this is not a native GUI/security certification.

## 0.1.0 — 2026-10-31

Initial standalone Omarchy community-plugin package.

- Search window title/application in a native themed overlay.
- Live selected-window preview with a translated no-content fallback.
- Focus across workspaces and explicit Ctrl+M bring-here action.
- Fresh-client and bounded-identifier validation before actions.
- Verified-unlocked admission, open-only lock polling and output-loss cleanup.
- GPL licence/source notices, nine component unit checks, install/remove documentation and release checklist.

The runtime QML/JS is preserved from the exercised prototype. Packaging is not a claim of marketplace approval, full accessibility, complete multi-output rendering coverage, or an all-green whole-shell resource benchmark. See README limitations.
