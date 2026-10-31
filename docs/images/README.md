# Screenshot provenance

Real **Native Overview 0.2.0 candidate** captures, not HTML recreations.

| Asset | What it shows |
|---|---|
| `window-search.png` | Multi-word `FOOT notes` query, two real Foot terminals on workspaces 1 and 3, larger selected-window preview. |
| `workspace-filter.png` | Same query after Ctrl+Space: only the release-notes terminal on workspace 3. Window workspaces were checked unchanged. |
| `bring-here.png` | Search reopened after a real Ctrl+M action moved project notes to workspace 3 without switching the viewing workspace. |

Captured on 2026-10-31 in an isolated, no-network nested Hyprland session using the actual Omarchy shell. Foot terminals contain harmless sample notes, not private desktop documents.

These 1000×580 native-card crops were made before the packaging-only move into the versioned runtime directory. The QML, JavaScript and catalogue bytes are identical to the final locations listed below. The changed manifest/loader was separately exercised by a real running-shell upgrade; that assertion initially failed before the versioned path fix and then passed. The images are not retroactive evidence of that earlier loader run.

No interface elements were drawn, retouched, blurred or recolored. Only cropping and PNG encoding were applied. Full frames, private process/configuration logs and installation receipts do not ship in the public repository.

## Rendered code/catalogue SHA-256

```text
d248203d0bd447bf014e3605cf6bab5bb94748950f9d387af2ded603c980bc6d  runtime/0.2.0/Overview.qml
1e0685d1819978ab94eef36212b851781c92f64ffda518fd438c4405efc65821  runtime/0.2.0/BoundedProcess.qml
c6daf0e4a82d04193f57fdafed0f5810684c95dfc2cc539240ac195384a428cd  runtime/0.2.0/WindowPreview.qml
14a55019c20e8b5c19c3bab053c74f08b683d117e68404fb3267278e56468492  runtime/0.2.0/WindowModel.js
de1083ce726402cd5f133308e9e734f25582f5d6a8d29255d6a59c792b73c1a2  runtime/0.2.0/i18n/en.json
```

## Asset SHA-256

```text
7afae6ee2273784067b953164be7a106f910efeb8ac1a180a784fca654139127  window-search.png
2ccd8b6d1db6d459375b5c13d2b83be909a3f7fc140b7ce7c21edb2de56131ab  workspace-filter.png
f73c1b538ca9db8935014002601370ceeb837dd5cb3748dde9898c5fcd37eece  bring-here.png
```

Theme/typography come from Omarchy. Controls are also documented in readable text, not only in screenshots.
