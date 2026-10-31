# Source and licence notices

Native Overview is distributed under GPL-3.0-only. See LICENSE for the full licence.

## Selected-window preview

`runtime/0.2.0/WindowPreview.qml` adapts the lifecycle-bound `ScreencopyView` fragment from end-4/dots-hyprland, `dots/.config/quickshell/ii/modules/ii/overview/OverviewWindow.qml` lines 93–97 at commit `2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8`.

Source: https://github.com/end-4/dots-hyprland/tree/2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8

Copyright end-4 and contributors. The adapted code remains GPL-3.0-only; the attribution is also retained in the file. Donor shell geometry/effects are removed. Local glue supplies address-based toplevel lookup, an open-only selected-preview Loader, no-content text and Omarchy integration. This is a narrow adaptation, not a port of the entire ii shell.

## Native integration

`runtime/0.2.0/Overview.qml`, `runtime/0.2.0/WindowModel.js` and tests are local integration code distributed as part of this GPL package. The implementation imports the installed Omarchy `qs.Ui.OverlayWindow` and `qs.Commons` theme/translation/filter APIs. The built-in emoji overlay and OverlayWindow were read to follow the existing plugin contract; Omarchy source is neither modified nor vendored here.

No Hyprspace, hy3, dynamic-cursors, Pyprland, Vicinae or wl-mirror source is included. Workspace grouping and drag/drop are not implemented. This is an independent community plugin, not an official Omarchy component. Marketplace verification is tied to its recorded snapshot, not every later release.

