# Validation and limits

These are observed checks, not a security audit or a supported-platform matrix. Historical receipts live outside the public source tree so private process/configuration traces do not ship with the plugin.

## Local installation

The 0.1.0 package was installed through Omarchy's native plugin manager from a frozen local git source. Installed commit and tracked bytes matched the package. Actual live open/close, disable/re-enable, one overlay on the focused DP-2 output, and preview-component creation/destruction were checked. The optional Super+D binding was registered without replacing another binding. Hyprland configerrors were empty; unrelated shell configuration was preserved. One expected external-plugin-path scanner notice occurred, with no unexpected plugin warning/error.

A full-shell restart and full removal of that user's installed checkout were not exercised. They are not implied by successful open/close or by the documented removal command.

## Component checks

The initial package carries four window-model checks and five admission/lifecycle checks. They cover malformed/oversized data, markup-shaped titles, hostile addresses, stale client lookup, bounded destinations, admission pending/unknown/failed/abnormal/timeout paths and cancelled probe completion. Lifecycle checks execute the real QML JavaScript entry points with stubbed process/Qt objects; they do not prove signal delivery or rendering. New regression counts, if added, must come from the runner output rather than this historical count.

`bash test.sh` uses a read-only source bind, fake HOME and no network with existing bubblewrap and Node. The GitHub workflow runs the JavaScript checks and release-layout checks directly in an ephemeral runner. [Hosted CI passed on the published v0.1.1 source commit](https://github.com/Battlelamb/omarchy-native-overview/actions/runs/41176718409), reporting 5 model, 19 lifecycle and 4 package-layout checks passed. It does not render Omarchy or test screencopy/GPU behavior.

## 0.1.1 candidate regression checks

The pre-publication review findings now have component regressions: sustained-event refresh starvation, search/action membership beyond client 256, failed dispatch handling and cancelled verification affecting a later opening. The candidate runner reports **5 model + 19 lifecycle checks, 24 total**, plus four package-layout checks. The parent and independent reviewer reran these; final source review found no concrete blocker. The final cancellation guard also failed when removed in an in-memory mutation check.

A separate focused native run passed **34 functional checks and 7 outer isolation checks** using the actual installed Omarchy shell in the existing isolated desktop. It exercised search/preview, real cross-workspace focus, bring-here, closure and reopening. Equivalent genuine focus/move commands returned normal exit zero and `ok`; their effects were read back. This was not intercepted plugin stdout or exact close-versus-ack timing evidence.

**That native receipt predates the final single-line cancellation guard.** The guard has fresh component regression and independent source-review coverage, not a claimed new native GUI run. Source-specific GUI error paths, lock races and other documented gaps remain. Hosted CI passed on the published release-source commit; the linked workflow does not test these remaining native GUI cases. Historical 0.1.0 GUI and resource receipts are separate, not extra tests of the changed candidate.

## Historical real-GUI checks

The same runtime originated in a nested compositor running the actual installed Omarchy shell, with fake HOME, private session IPC, bounded lifetime and live-state comparisons. No test fixture, helper shim or background observer is part of plugin startup.

Observed behavior includes actual title filtering, focus across workspaces, explicit bring-here movement, cyan fixture pixels and changed frame pixels, balanced preview-object lifetime after closing, missing/destroyed-source fallback and recovery, selected-window close rejection for both focus and move, genuine nested protocol lock/automatic unlock and denied locked/unknown/pending/timeout admission. Output removal was genuine but used a **0x0 headless output**. No claim of rendering on two usable screens follows.

Negative controls failed before implementation, and a valid unsafe-model mutation failed both stale-window rejection checks. An apparently passing visual check was rejected because its probe was obscured; cropped OCR and visual review were then used. Passed lifecycle counts do not establish that every compositor/GPU allocation was released.

## Repeated-use resources

Twelve animated synthetic windows and sixty real open/close cycles took approximately 76 seconds, followed by a fixed ten-second closed tail. Preview-component counts balanced at 71 created/71 destroyed across each suite. This is not a workload of many real applications or a long-duration soak.

The original seeded-shell workload scored **38 GUI passes / 1 strict resource-envelope failure**, with 7 outer checks passed. A traced reproduction identified all 24 excess descriptors: eighteen pipes and six pidfds belonging to six Tailscale query children, with both pipe endpoints and pidfd target PIDs recorded. No overview production fix was justified from that observation.

Disabling only Tailscale in fake HOME, keeping the same plugin source, pacing and thresholds, scored **39 GUI passes / 0 failures**, with 7 outer checks passed and no late descriptor growth. **This different loaded-plugin workload does not fix or turn green the original failing gate.** The descriptor thresholds were not relaxed. The approximately 3.1%-of-one-core observer cost was measured separately; no performance improvement is inferred between runs.

The earlier whole-shell measurements are not isolated plugin costs, a live NVIDIA benchmark, or evidence that the plugin is leak-free. More isolated/longer resource coverage remains open. The historical failures and raw receipts were retained unchanged.

## Remaining coverage

Usable second-display rendering, actual GPU/compositor stall/denial, lock/action and post-verification races, full text input/IME/accessibility, exhaustive mouse/arrow/theme/reduced-motion interactions, complete restart/removal, and longer isolated resource behavior remain incomplete. There is no zero-frame privacy claim. New releases must state what their actual checks add rather than treating documentation as execution.
