# Native Overview

A window finder for the Omarchy Quattro shell. Search by application or window title, see one live preview, and either jump to that window or bring it to your current workspace.

**Version 0.1.0 — initial community plugin.** This is not an official Omarchy component, an approved marketplace listing, a complete workspace overview, or a second desktop shell.

## Features

- Omarchy-native overlay, theme, translation fallback and reduced-motion behavior inherited from the base overlay.
- Case-insensitive title/application search; keyboard selection and mouse activation.
- One selected-window live preview. No preview while the overlay is closed.
- Fresh client lookup before focus/move; stale windows are rejected.
- A translated `Preview unavailable` state when the selected source has no content.
- No network, telemetry, clipboard access, privileged service or downloaded executable.

## Requirements

Tested on Omarchy **4.5.0rc2-1**, Hyprland **0.56.2-4** (Lua dispatchers), Quickshell **0.3.2** (Omarchy build), and Qt **6.12.0**. Other combinations are not claimed compatible.

Runtime programs are supplied by the matching Omarchy installation: `/usr/bin/hyprctl`, `/usr/bin/timeout`, `/usr/bin/omarchy-hyprland-session-locked`, and that helper's `jq` dependency. Uses installed `qs.Ui`, `qs.Commons`, `Quickshell.Hyprland` and `Quickshell.Wayland` APIs. Missing/failed lock verification denies opening; do not replace it with an always-unlocked shim.

## Install

The public repository URL has not been assigned or published yet. Once published, use the real reviewed repository URL with:

```bash
omarchy plugin add <repository-url> --enable
```

A local git repository is also accepted. For a checkout at `/srv/projects/omarchy-native-overview`:

```bash
omarchy plugin add file:///srv/projects/omarchy-native-overview --enable --yes
```

This uses Omarchy's plugin manager, not a bespoke installer. Installing does not automatically edit keybindings or replace an existing widget. Plugins run **unsandboxed inside your existing shell**; inspect source before installation.

## Open and use

```bash
omarchy-shell shell toggle leviathan.native-overview '{}'
```

Suggested free binding, **after checking your own current bindings**, in `~/.config/hypr/bindings.lua`:

```lua
o.bind("SUPER + D", "Native Overview", "omarchy-shell shell toggle leviathan.native-overview '{}'")
```

Back up your bindings before editing. Apply with `hyprctl reload`, then check `hyprctl configerrors`. On Ömer's installation this shortcut is configured separately; it is not installed automatically for other users.

| Key/action | Result |
|---|---|
| Type | Search title/application |
| Up / Down | Select previous/next result |
| Enter or click | Focus selected window |
| Ctrl+M | Move selected window to the current workspace, without switching workspace |
| Backspace | Edit search |
| Escape or click outside card | Close |

Closing destroys the selected-preview component and clears the current window/query state. Nothing is persisted by this plugin.

## Disable and remove

```bash
omarchy-shell shell hide leviathan.native-overview
omarchy plugin disable leviathan.native-overview
# To remove the installed checkout, when you intend to delete it:
omarchy plugin remove leviathan.native-overview --yes
```

Remove your own shortcut line if you added one. Disabling/removing does not automatically edit your Hyprland configuration. No custom daemon, package, timer or shell replacement is installed.

## Privacy and limitations

Only normal **exit 1** from Omarchy's compositor-lock helper allows opening. Locked, unknown, error and timeout paths deny or dismiss. Lock state is **sampled every 250 ms while open**, with a 2-second probe timeout and 1-second kill grace. This is **not instantaneous or a zero-frame privacy guarantee**. The compositor's real lock screen remains the security boundary; the plugin does not implement authentication.

Target-output disappearance dismisses the overlay. Testing covered genuine removal of a zero-sized headless output, **not rendering on two usable displays or physical unplug**. Other open issues: post-verification/lock-action races, compositor/GPU capture denial or retained-frame stalls, IME/caret/accessibility, complete mouse/arrow/theme integration coverage and a longer isolated resource benchmark. Search currently uses key-event filtering, not a full text-input control. Normal workspaces 1–9999 can receive bring-here actions; special workspaces are not destinations.

## Validation and evidence

```bash
omarchy plugin validate .
bash test.sh
```

`test.sh` runs **nine model/lifecycle checks** read-only with a fake HOME and no network using existing `bwrap` and Node. These are development-only dependencies; the installed plugin does not run Node or the test suite. The lifecycle tests execute QML JavaScript with stubbed process/Qt objects; they are not a substitute for real GUI execution.

The same production QML/JS has also been exercised in the real Omarchy shell in an isolated nested compositor: search, actual focus/move, live frames, preview lifetime, missing-source fallback, stale selection, genuine nested lock and output removal. Sixty-cycle tests balanced 71 preview creations/destructions. The full seeded-shell resource gate **failed**, with the reproduced excess descriptors attributed by kernel pidfd/pipe ownership to Tailscale pollers. A control disabling Tailscale only in the fake HOME passed, but is **not** a passing original workload or proof of leak-free operation. No threshold was relaxed. Do not call this a fully green stress/performance certification.

See [CHANGELOG.md](CHANGELOG.md), [SECURITY.md](SECURITY.md), [NOTICE.md](NOTICE.md) and [docs/RELEASING.md](docs/RELEASING.md). A normal local installation verification is separate from public release/marketplace approval.

## Licence

GPL-3.0-only. The selected-preview lifecycle fragment is adapted from end-4/dots-hyprland at commit `2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8`; see [NOTICE.md](NOTICE.md) and [LICENSE](LICENSE). Omarchy components are imported from the installed shell rather than copied into this repository.
