# Changelog

## 0.3.1 - public identity and update compatibility

- Use the public `battlelamb.native-overview` plugin ID and Battlelamb author identity.
- Move the runtime to a fresh versioned path, including its revision readback and tests.
- Keep the preference store and options unchanged; existing menu/binding references require a coordinated namespace migration.
- Replace internal workstation and release-process notes with concise public validation and compatibility guidance. Required source attribution and public history are preserved.

## 0.3.0 — development/testing source snapshot

- Native secondary Configure page with saved all/current default scope, existing/name/workspace order, thumbnail visibility and explicit options-only Reset.
- Reuse the GPL bounded private preference helper outside the installed runtime. No saved window addresses or new window-action backend.
- Sort filtered results stably before the display cap; fresh focus/bring-here membership checks stay independent.
- Release capture in Configure, with thumbnails off and in very short layouts; reserve readable real-font list/settings geometry and keyboard-scroll focused settings controls.
- Versioned 0.3.0 runtime and literal `featureRevision()` readback method; existing Super+D remains unchanged.
- Ship standalone option/store/package-dependency and private native Qt keyboard/persistence/layout regressions, with preference-store tests included in hosted CI. Refresh illustrative Browse/Configure previews; historical failed gates remain labeled.

No installed upgrade, live/full-shell upgrade/rollback, GPU capture qualification or performance improvement is claimed. Source publication and exact-commit hosted CI are recorded separately; neither constitutes a stable release.

## 0.2.0 - 2026-10-31 (feature pre-release)

- Search for multiple words in any order across a window's title and application name; every word must match the same window.
- Toggle a current-workspace filter with Ctrl+Space or its native button, without moving windows or discarding the search.
- Add a clear-search control and localized displayed-result counts, with explanatory empty states.
- Replace the small top thumbnail with a native-themed list/preview split on wide windows and a stacked layout on smaller windows.
- Reuse validated display clients until the raw response changes, instead of reparsing the entire response for each search edit. Focus and move still independently validate a fresh response.
- Consolidate repeated text styling in one plain-text label component; reuse Omarchy's existing buttons and theme tokens. No new runtime package, network service or clipboard access.
- Give runtime QML/JS/catalogue one versioned directory and update the manifest entry point, preventing stale compiled components during an in-session upgrade without duplicating code or restarting the shell.
- Preserve the 0.1.2 process ownership, raw-output bounds, independent deadlines and fail-closed lock admission.

The earlier whole-shell resource gate remains failed. Reduced parsing work is not a measured desktop speedup, memory reduction or an isolated plugin-cost benchmark. Exact execution coverage and retained failed attempts are documented in docs/VALIDATION.md.

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
