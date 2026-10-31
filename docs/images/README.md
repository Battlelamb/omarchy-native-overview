# Screenshot provenance

These are real captures of **Native Overview 0.1.2**, not HTML recreations of its interface.

| Asset | What it shows |
|---|---|
| `window-search.png` | Query `notes`, with the selected project-notes terminal on workspace 1 and the release-notes terminal on workspace 3. |
| `bring-here.png` | The same search after a real Ctrl+M action moved the selected terminal to workspace 3. The viewing workspace stayed at 3. |

## Capture context

- Captured on 2026-10-31 from an isolated, no-network nested Hyprland session running the real Omarchy shell and installed 0.1.2 plugin code.
- Plugin source revision: `c51703b5733fc7332aeb0d1042e8598be34912f8`.
- The windows are real **Foot terminals with deliberately harmless sample content**. They are not the author's private desktop, and their sample titles are not real personal documents.
- The selected-window preview is the plugin's actual screencopy output. The after-image was taken only after checking the target window's actual workspace and the unchanged viewing workspace.
- Images are 760 × 580 pixel crops of the native overview card. No interface elements were drawn, retouched, blurred or recolored; only cropping and PNG encoding were applied.
- The full screenshots and local capture checks are kept out of the public repository. The captures passed four direct checks and seven outer-isolation checks; the live configuration, shell and compositor were unchanged during capture.

## Asset hashes

```text
92932aa8b70b57d6614f250f2d5be051c7acc5c8ddf6405d95f8e9dbee0cbd57  window-search.png
a9f4240c34191a02f7e80b1f71020092c14a152ec172832134a7435cc06240e3  bring-here.png
```

The surrounding interface follows the user's Omarchy theme. README controls are also documented as text so the small text inside a screenshot is not the only source of instructions.
