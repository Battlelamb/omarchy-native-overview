# Security and capabilities

This plugin runs unsandboxed in Omarchy's existing Quickshell process with the logged-in user's permissions. It is not an authentication mechanism.

## Access used

- Hyprland client metadata (application, title, window address, workspace, output).
- Selected-window screencopy while the overview is open.
- Installed `hyprctl clients -j` and validated Lua focus/move dispatchers.
- Installed compositor-lock helper, bounded by GNU timeout, only during admission and while open.
- Omarchy theme and language APIs.

No network calls, telemetry, clipboard reads, persistent private window database, privileged helper, package installer, input-device access or autostart service is supplied. The shell itself and other enabled plugins may have broader capabilities.

Window titles/application text use Text.PlainText. Window addresses and destinations are validated; strings containing window titles or search input are never interpolated into commands. The current client list is re-read before action, but a close/reuse/lock after that verification remains a race, not a transactional compositor guarantee.

Lock state is sampled, not instantaneous. Do not describe it as preventing all post-lock frames or use this plugin as a substitute for the compositor's real lock. Unknown state fails closed. Compositor/GPU stalls and retained-frame behavior remain incompletely tested.

Before public release, choose an owner-controlled private reporting contact and document it here. None is invented in this local package. Do not post sensitive window titles or screenshots in public bug reports. Inspect commits before updating; mutable upstream HEAD is not an assurance that a reviewed version is installed.
