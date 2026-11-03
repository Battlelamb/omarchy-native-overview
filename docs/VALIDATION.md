# Validation and limits

## Current development snapshot

Version 0.3.1 changes the public plugin identity, versioned runtime URL and documentation. It does not change window-action authorization, saved option schemas or preference paths. Test results must be tied to the exact source revision; see [hosted component checks](https://github.com/Battlelamb/omarchy-native-overview/actions/workflows/checks.yml).

## Reproduce the checks

Use existing dependencies and an existing private scratch directory in `TMPDIR`:

```sh
env -u PYTHONPATH bash test.sh
env -u PYTHONPATH bash tests/native-io.test.sh
env -u PYTHONPATH bash tests/native-overview.test.sh "$TMPDIR/native-overview-evidence"
python3 scripts/check-package.py
```

- The offline suite checks options, model/schema validation, cancellation/lifecycle behavior, private preference persistence, atomic-write failures, budgets and missing-package controls under fake HOME.
- Native subprocess checks exercise actual Qt collectors, bounded output, cancellation and independent deadlines.
- Native settings scenarios render real Qt controls with fictional window metadata, isolated IPC and software rendering. They check saved scope, sorting, thumbnail visibility, options-only Reset, reopened readback and focused-control geometry.
- These are not a full security audit, real-window capture proof or a supported-platform matrix. A workflow badge does not qualify desktop behavior.

## Historical coverage and unresolved gates

Earlier versions exercised filtering, focus, bring-here and repeated opening in an isolated compositor. An old-to-new runtime-path upgrade and rollback was observed for the historical 0.2.0 release. Those results do not qualify the current namespace migration or every later version.

**The historical whole-shell resource gate failed and remains failed.** A different loaded-plugin workload passing did not repair it. Balanced preview-object counts do not establish GPU-memory reclamation or an isolated no-leak guarantee. Raw workstation/process traces are not distributed with this package; earlier public history is preserved.

Still unqualified: complete current-version real-shell upgrade/rollback, physical output/hotplug behavior, live capture and lock/action races, GPU denial/stalls, full IME/accessibility and long-duration isolated resource behavior. There is no zero-frame privacy guarantee.

[Preview provenance](PREVIEW.md) describes the historical illustrative screenshots. Source publication, local installation and marketplace approval are separate states; no stable release or marketplace approval follows from these notes.
