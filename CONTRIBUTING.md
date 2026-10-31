# Contributing

Small fixes and compatibility reports are welcome. Please describe the problem and how to reproduce it before proposing a large UI or dependency change.

## Development

This is a QML plugin for Omarchy's existing shell, not a standalone Quickshell configuration. Do not run a second shell or modify packaged files under `/usr/share/omarchy`.

Local checks:

```bash
omarchy plugin validate .
bash test.sh
python3 scripts/check-package.py
```

The component test runner needs existing Node and bubblewrap. These are not runtime dependencies. CI runs the same JavaScript component checks directly in its disposable runner and checks release layout; CI does not claim to render Omarchy or exercise GPU capture.

Keep `Text.PlainText` on dynamic text. Never construct executable text from window titles, application names or search input. Keep the fresh-client and identifier/destination validation. Do not weaken unknown-lock-state handling or add hidden background capture, clipboard readers, network calls, global shortcuts or config mutation on load.

## Changes and evidence

Add a focused regression test for behavior changes. Keep source provenance and GPL notices when adapting donor code. Do not overwrite historical failed receipts or turn a different workload into a claimed fix. Screenshots, benchmark numbers and platform claims must come from real execution and state what was not tested.

Please do not include personal window titles, private screenshots, credentials, shell logs from unrelated plugins or full environment dumps in issues. Report public bugs with versions, a minimal reproduction and redacted output. For security issues see SECURITY.md.

Changes are reviewed before release. Contributors retain copyright in their changes and submit them under this repository's GPL-3.0-only licence. Avoid unrelated cleanup in a bug-fix pull request.
