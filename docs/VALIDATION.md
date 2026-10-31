# Validation and limits

These are observed checks, not a security audit or a supported-platform matrix. Historical receipts live outside the public source tree so private process/configuration traces do not ship with the plugin.

## 0.2.0 feature validation

The candidate retains the hardening mechanisms from 0.1.2. Its changes are multi-word AND search, optional current-workspace filtering, clear/count controls, a native split/stacked layout and display-only validated-client reuse. Action verification still fetches and validates a fresh uncapped membership response; cached display clients never authorize actions.

The parent reran **13 model + 28 lifecycle + 3 UI-contract groups** in offline bubblewrap, and **18 native offscreen I/O cases**. The UI-contract groups evaluate actual source expressions/handlers but do not render QML. Model regressions include invalid scope rejection, filter-before-cap ordering and query filtering with zero JSON parses after validation; fresh action authorization independently parses its response. Scope, clear, keyboard and empty-preview changes have retained RED/GREEN receipts.

The real installed shell was exercised in a no-network nested compositor with a copied HOME and harmless real Foot windows. The completed core run recorded **12 passed and 2 failed**: real multi-word title/application search, Ctrl+Space, pointer clear/scope actions, preserved keyboard focus, zero-result feedback, Enter cross-workspace focus, Ctrl+M movement, balanced preview cleanup and no plugin QML errors passed. The 2 failures were explicit headless-mode setup checks: those requested outputs reported 0×0, so no responsive rendering coverage was accepted from them. The count oracle rejected a wrong-count control. **40 paced open/close cycles** completed; preview-object totals across the exercise were **44 created/44 destroyed**. These are object-lifecycle observations, not proof of GPU-memory reclamation.

A separate, focused steady-size run verified actual **800×600 and 480×360** nested output dimensions and visible native header/footer at both sizes: **5 passed, 0 failed**. Only the uniquely identified test-container window was resized, checking its systemd ownership/PID/executable; no user window or desktop configuration was resized or edited. The isolated shell was freshly started at each established size. This does **not** establish correct live monitor-resize, physical hotplug or second-display behavior.

Earlier attempts remain immutable: full-card OCR read zero as a copyright symbol despite the correct visible empty state; a tight header crop/PSM7 was calibrated against 0/1/2 and wrong-count controls instead of accepting the glyph as zero. Resize attempts included a refused class-based owner check, a stale handshake, and a transparent overlay after dynamic resizing. The final ownership check uses the actual systemd PID/cgroup/executable. A compositor debugging-startup notification obscured the small header in one frame; the final run first checked empty configuration errors and dismissed only the nested compositor's notifications before capture. None of these failed attempts was relabeled as passing.

A real in-session upgrade initially failed its visible new-UI assertion even though cloned commit/version checks succeeded: the shell retained an older compiled component behind the unchanged QML URL. The package now has one versioned runtime tree at `runtime/0.2.0/`; the rendered QML/JS/catalogue contents were proven byte-identical after relocation. The repeat **0.1.2→0.2.0 upgrade/rollback exercise passed 12 checks**, including a deliberately invalid clone that restored the previous checkout, the exact installed candidate SHA, an actual visible new result-count UI/model, close, preserved settings, enabled state and the same surviving shell process. No shell restart or installed Omarchy source edit was used. The earlier stale-UI failure is retained, not relabeled.

The new layout adds controls and therefore is not presented as a total source-line reduction. Debloating removes repeated JSON parsing during search edits and consolidates text styling/reuses native buttons; it does not remove lifecycle/security fences. No new measured desktop latency, memory reduction, FPS, GPU qualification or repaired whole-shell resource envelope is claimed. **The earlier whole-shell resource gate remains failed.** Raw traces stay outside the public package.

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

## 0.1.2 hardening validation

The hardening runtime rejects non-string addresses, enforces a true UTF-8 byte cap, uses per-request Process/collector ownership, recovers from failed lock-process start, and bounds subprocess output and lifetimes. The checks below were completed before publication, while the installed 0.1.0 and earlier tags remained untouched. The release's only subsequent runtime-payload change is the manifest version from 0.1.1 to 0.1.2; the reviewed QML/JS bytes are identical.

The parent reran **10 model + 22 lifecycle checks** in the offline component box. The model coverage includes 25,000 seeded malformed-schema cases, UTF-8 boundaries and independent byte-oracle checks. A separate replay of the original independent audit's model assertions passed **13 checks and 50,000 seeded schema/injection cases**, with zero schema exceptions or mismatches. Its obsolete direct-Process callback extractor is not claimed to test the redesigned wrapper; the current lifecycle/native suites cover that contract. These source-policy tests preserve refresh throttling, pending drain, action failure/search retention, fresh membership, and cancellation across a new active request.

A separate **18-case native offscreen Qt/Quickshell suite** passed in bubblewrap. It exercises the actual bounded-I/O component: ASCII/UTF-8 caps before collection, one overflow sentinel, normal/nonzero/missing-program/FailedToStart outcomes, literal shell metacharacters, a TERM-ignoring child, cancellation with a replacement request, destruction of a dynamic QML owner, and cancel followed immediately by Loader unload. Sampled hanging/cancelled/owner-destruction command PIDs were gone before their cases were accepted; the cancel/unload case also records and verifies termination of the pipeline bash, head, command and both watchdogs. An initial owner-destruction test failed and drove the independent-inner-watchdog fix. These are actual native Process/collector tests, not compositor rendering or forensic memory-erasure evidence.

The final hardening payload completed a visible **48-window / 300-cycle** nested run: **38 passed, 1 failed**, with **7 passed / 0 failed** outer-isolation checks. Focus, bring-here, real animated preview pixels, stale-selection rejection, visible fallback (with normal-content OCR control), real nested lock/unknown/timeout teardown, output loss, balanced capture destruction and the strict plugin-error filter passed. The exact runtime hashes match the independently approved source.

The remaining failure is the unchanged whole-shell resource envelope, not a passing gate: the final cycle had **8 extra descriptors**, mapped through pidfds and pipe endpoints to **two nvidia-smi polls**. A fixed-tail sample had **28 extras**, mapped to **six Tailscale polls (24)** and **one nvidia-smi poll (4)**. The final sample returned to **209 descriptors**, matching the pre-spike baseline. No excess descriptor in those failed-gate samples belonged to Native Overview. This attributes the observed spikes; it is not a no-leak guarantee or a fix to the original failed gate. Neither poller was disabled, and thresholds were not relaxed.

The shell process averaged **12.96% of one CPU core** over the paced soak; the late closed-state RSS spread was **2.30 MiB**. These are whole-shell-process observations, not isolated plugin/process-tree costs, FPS, or a GPU benchmark. Original failed receipts remain unchanged. The first attempt to start this final run failed203/EXEC because archived harness scripts lacked executable permission; that failed launch was preserved separately before correcting the disposable harness and running the completed test above.

During the completed nested run, the installed plugin, live shell/compositor PIDs and shell configuration remained unchanged; both test units stopped and focus was restored. The earlier preparation snapshot had a different shell-config hash before that run's baseline/seed was captured; its cause was not established, no live config was restored, and whole-task byte preservation is not claimed. Local checks do not imply new hosted CI, a release, an installed upgrade or security certification.

## Remaining coverage

Usable second-display rendering, actual GPU/compositor stall/denial, lock/action and post-verification races, full text input/IME/accessibility, exhaustive mouse/arrow/theme/reduced-motion interactions, complete restart/removal, and longer isolated resource behavior remain incomplete. There is no zero-frame privacy claim. New releases must state what their actual checks add rather than treating documentation as execution.
