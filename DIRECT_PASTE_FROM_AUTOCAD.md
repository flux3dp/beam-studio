# Beam Studio — Direct Paste from AutoCAD (fork)

This is a fork of [flux3dp/beam-studio](https://github.com/flux3dp/beam-studio) that
adds a **copy-in-AutoCAD → paste-in-Beam-Studio** workflow, so you no longer have
to *Save As DXF → import file* every time.

## What was added

1. **Beam Studio paste handler** now recognizes **DXF text** on the clipboard and
   imports it through the normal DXF pipeline (unit/DPI dialog, undo history, layers,
   unsaved-changes tracking all preserved).
   - File: `packages/core/src/web/app/actions/beambox/svg-editor.ts`
     (the global `paste` event handler, ~line 525).
2. **`autocad/BeamCopy.lsp`** — an AutoCAD command (`BEAMCOPY`) that exports the
   current selection to a temp DXF and puts the DXF **text** on the Windows clipboard
   via `clip.exe`.
   - Setup + usage details: `autocad/README.md`.

## Why not "real" AutoCAD Ctrl+C?

When you press Ctrl+C in AutoCAD, the clipboard gets a **binary DWG** (a temp file) and
a **Windows metafile (EMF)** — neither of which a web/Electron app can read as vectors.
The most a normal paste could recover is a raster image, which is useless for cutting.
`BeamCopy.lsp` sidesteps this by putting **DXF text** on the clipboard, which Beam Studio
can parse into real vector cut paths.

## The workflow

1. **AutoCAD:** type `BEAMCOPY`, select objects, press Enter.
2. **Beam Studio:** click the canvas, press **Ctrl+V**, choose units in the dialog.

> Requires full AutoCAD (AutoLISP). AutoCAD **LT** is not supported.

---

## Building & running this repo

Prerequisites: **Node.js ≥ 24.11.1** and **pnpm** (`npm install -g pnpm`).

```bash
# from the beam-studio/ folder
pnpm install            # install dependencies (first time only)

# Web app (fastest way to try the paste change) -> http://localhost:8080
pnpm nx run web:start

# Electron desktop app
pnpm nx run app:dev     # build for development
pnpm nx run app:start   # launch

# Quality checks
pnpm nx run core:test   # unit tests for the core package
pnpm lint               # lint all projects
```

The clipboard paste change lives in `packages/core` (shared), so it applies to both the
web and Electron apps. Some machine-communication features need external services
(FLUXGhost, Swiftray) but the editor/import works without them.

## Testing the paste change without AutoCAD

You can verify the Beam Studio side using any plain DXF file:

```bash
# macOS/Linux: put a DXF's text on the clipboard, then Ctrl+V in the running app
cat some.dxf | pbcopy           # macOS
xclip -sel clip < some.dxf      # Linux
```
```powershell
# Windows PowerShell
Get-Content some.dxf -Raw | clip
```
Then focus the Beam Studio canvas and press **Ctrl+V** — the geometry should import.
