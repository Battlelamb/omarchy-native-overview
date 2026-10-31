# Changelog

## 0.1.2 — 2026-10-31 (hardening patch)

- Reject non-string window addresses without coercion or exceptions.
- Enforce the client-input limit in UTF-8 bytes, including CJK, emoji and unpaired-surrogate boundaries.
- Give every lock, refresh, verification and dispatch request distinct process/collector ownership; retired runs cannot complete newer requests.
- Recover fail-closed from lock-process start failure instead of leaving admission stuck.
- Bound collected stdout upstream, with one overflow sentinel byte and explicit rejection, and enforce subprocess deadlines through independent watchdogs.
- Preserve the command deadline when a QML request owner is destroyed; retain literal positional arguments rather than interpolating them into shell code.
- Add 25,000 seeded schema cases, byte-limit controls, lifecycle regressions and native offscreen I/O/owner-teardown tests.

Full validation and remaining limitations are recorded in docs/VALIDATION.md. The original tags are preserved. This patch fixes the identified plugin defects; it does not claim the still-failed whole-shell resource gate passed.

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
