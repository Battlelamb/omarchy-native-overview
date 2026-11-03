# Public preview provenance

## Illustrative 0.3.0 Browse and Configure previews

`preview.png` and `configure-preview.png` are real native Qt/Quickshell card captures of this candidate, using safe illustrative data. The caption explicitly labels the version and illustrative status. They are not captures of a live desktop, installed library, action confirmation, full-shell upgrade or rollback.

The private offline harness adapts only the OverlayWindow surface to an offscreen FloatingWindow, removes layer-shell namespace/output callbacks, adds inspection aliases and substitutes the lock probe with `/usr/bin/false`. Native candidate layouts, controls, tokens, controller and settings editor are rendered from the recorded source. Configure uses the actual bounded backend preferences/schema in an empty fake HOME, not a drawn approximation. No Save/Reset or external action is exercised by this preview run; earlier native action tests are separate evidence.

Overview imports an isolated Hyprland metadata facade and uses three fictional windows (Desktop, Design, Terminal). Thumbnails are deliberately disabled through the real preferences helper, so no window texture or capture is invented.

All rendering runs inside cleared-environment, network-unshared bwrap with fake HOME, read-only candidate mounts, software Qt/offscreen, no host sockets, and provider deny stubs. Public PNG metadata is stripped with CRC validation and identical decoded RGBA before/after stripping. The on-image caption is added after native capture, without altering card content.

Recorded native checks: 11 assertions, 3 accepted fictional rows, usable contained native objects, the untruncated native heading, real schema controls, and close/helper cleanup. This is single wide-layout preview coverage, not compact/accessibility/font or integration qualification.

The exact native runtime inputs are listed below. Private per-render receipts preserve the adapted QML and fixture hashes; those diagnostics are not bundled with the plugin. Source version: 0.3.0. Existing font/component rights remain separate. No wallpaper, game art or font binary is bundled or relicensed.

### Exact capture inputs

Runtime files (SHA-256):

```json
{
  "BoundedProcess.qml": "1e0685d1819978ab94eef36212b851781c92f64ffda518fd438c4405efc65821",
  "Options.js": "87e1b4fd8ef9c590cd6047824fc33c3b7a6927c5b4b9da29390ff1237014f2c0",
  "Overview.qml": "79df1c0323d4353fea26d2f5da5aa1b381bf7c6c57184fca7094135eef6e8346",
  "Settings.qml": "620e0aa0e894279df94b5bd917c45e9d5c549abf403335a6c8e0e912024af303",
  "WindowModel.js": "691131c29b28bf92ec34ccaaec308b3d5d813895c1b0c102701de832e19000c1",
  "WindowPreview.qml": "c6daf0e4a82d04193f57fdafed0f5810684c95dfc2cc539240ac195384a428cd",
  "i18n/en.json": "7b68f97c07bc50bfa45fc6850f262e347c34256b0ac47c41f085dad38bff7077",
  "preferences.py": "03fe78feccfba7c93e471e295332f01ca75993ebef0a2d4727a8056238288760",
  "settings.py": "f9fe05a472b8863d63f15886a27db884783f93c0e3d2d36e6bcba3b114a684c9"
}
```

The native runtime is copied unchanged except the disclosed surface/facade/introspection adaptation. The private renderer records the adapted QML, fixture values and full invocation separately; those files are not public package dependencies. Use the shipped test runners for reproducible component and behavior checks.

These historical 0.3.0 images show illustrative native components, not a current-version live desktop or action confirmation. Versioned runtime updates do not change their recorded capture inputs or original font/component rights.
