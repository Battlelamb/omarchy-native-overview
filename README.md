# Native Overview

Find an open window without hunting through workspaces. Type part of its title or application name, check the live preview, then switch to it or bring it to where you're working.

A community plugin for the existing **Omarchy Quattro shell**, licensed GPL-3.0-only. It does not replace the shell or install a compositor plugin.

**0.1.2 is an early community pre-release with hardening fixes.** Upgrade older versions to receive the input-validation, subprocess-lifetime and stale-response fixes. It is not an official Omarchy component or an approved marketplace listing. [Release and source archive](https://github.com/Battlelamb/omarchy-native-overview/releases/tag/v0.1.2).

## What it does

- Searches window titles and application names.
- Shows one live preview for the selected window and a fallback when its source has no content.
- Focuses a window across workspaces, or brings it to the current workspace with Ctrl+M.
- Clears the query/window state and destroys the preview component when closed.

The plugin makes no network requests, reads no clipboard content, and installs no package, service or timer. Like other Omarchy plugins, it runs **unsandboxed in your existing shell**. Review source before enabling it.

## Compatibility

The runtime has been exercised on **Omarchy 4.5.0rc2-1**, **Hyprland 0.56.2-4** with Lua dispatchers, the Omarchy **Quickshell 0.3.2** build, and **Qt 6.12.0**. Compatibility with other versions is not established.

It imports the installed `qs.Ui`, `qs.Commons`, `Quickshell.Hyprland` and `Quickshell.Wayland` APIs. Runtime commands are `/usr/bin/hyprctl`, `/usr/bin/timeout`, `/usr/bin/bash`, `/usr/bin/head`, and `/usr/bin/omarchy-hyprland-session-locked` (whose installed implementation uses `jq`). Fixed positional-argument pipelines cap client stdout before collection at 1,048,576 bytes plus one overflow-detection byte; overflow is rejected, not published. The model independently enforces a true UTF-8 byte limit. Node and bubblewrap are development-test dependencies, not plugin runtime dependencies.

## Install

Public repository: [Battlelamb/omarchy-native-overview](https://github.com/Battlelamb/omarchy-native-overview).

Install the reviewed source through Omarchy's plugin manager:

```bash
omarchy plugin add https://github.com/Battlelamb/omarchy-native-overview --enable
```

This uses Omarchy's normal plugin manager. It does not add a shortcut or overwrite your configuration. Installation and updates follow the repository's current default branch; a marketplace listing does not pin mutable HEAD to a reviewed version. Review changes before updating.

## Update

For an installation from the public GitHub repository, review and apply the patch with:

```bash
omarchy plugin update leviathan.native-overview
```

Back up any local modifications first. A private/local frozen git origin does not follow GitHub updates; replace that installation deliberately with a backed-up checkout from the public repository rather than moving old tags.

## Open it

```bash
omarchy-shell shell toggle leviathan.native-overview '{}'
```

If Super+D is free on your system, back up `~/.config/hypr/bindings.lua` and add:

```lua
o.bind("SUPER + D", "Native Overview", "omarchy-shell shell toggle leviathan.native-overview '{}'")
```

Apply with `hyprctl reload` and check `hyprctl configerrors`. The shortcut is opt-in; the plugin never writes bindings on load.

| Key/action | Result |
|---|---|
| Type | Search titles and applications |
| Up / Down | Select a result |
| Enter or click | Focus that window |
| Ctrl+M | Bring it to the current workspace without changing the viewing workspace |
| Backspace | Edit search |
| Escape or click outside the card | Close |

Bring-here destinations are normal workspaces 1–9999, not special workspaces. This is a window finder, not a workspace thumbnail grid or drag-and-drop overview.

## Disable or remove

```bash
omarchy-shell shell hide leviathan.native-overview
omarchy plugin disable leviathan.native-overview
# When you intend to delete the installed checkout:
omarchy plugin remove leviathan.native-overview --yes
```

Remove the shortcut line yourself if you added it. No custom daemon or system package needs removal. Keep local modifications elsewhere before deleting an installed checkout.

## Known limitations

- Search uses key-event filtering, not a full text field with caret/IME support. Accessibility and complete mouse/arrow/theme coverage remain incomplete.
- Lock admission fails closed when Omarchy's helper is locked, unknown, missing or unsuccessful, including a process-start failure. While open, checks occur every **250 ms**. IPC requests have an inner **2-second deadline plus 1-second KILL grace**, with an independent outer **4-second / 2-second-grace fail-safe**; the inner deadline survives destruction of its QML owner. This is not instantaneous or a zero-frame privacy guarantee. The compositor's real lock is the security boundary.
- Target-output loss and source disappearance were exercised. Two usable-display rendering, physical unplug, GPU/compositor capture denial and retained-frame stalls have not been fully verified.
- A client lookup occurs before focus/move, but closes/address reuse or lock transitions after that lookup remain timing risks.
- Whole-shell resource gates have failed. The older descriptor spike was attributed to Tailscale polling and an older Tailscale-disabled control passed. In the hardening run, excess descriptors mapped to Tailscale and GPU telemetry polls, then returned to baseline. These are attributions, not green gates or proof of leak-free, isolated plugin cost.

Details and measured limits are in [docs/VALIDATION.md](docs/VALIDATION.md). Do not interpret the version number, CI or a marketplace listing as a security or performance certification.

## Development and licence

```bash
omarchy plugin validate .
bash test.sh
bash tests/native-io.test.sh  # local Qt/offscreen release gate; needs installed qs
python3 scripts/check-package.py
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md) and [docs/RELEASING.md](docs/RELEASING.md).

The selected-preview lifecycle fragment adapts end-4/dots-hyprland at `2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8`. Attribution and source paths are in [NOTICE.md](NOTICE.md); the full GPL-3.0 licence is in [LICENSE](LICENSE). Omarchy components are imported rather than vendored.
