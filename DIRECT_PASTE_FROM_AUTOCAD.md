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

## Installing the AutoCAD command (`BEAMCOPY`)

The AutoLISP file is in [`autocad/BeamCopy.lsp`](autocad/BeamCopy.lsp). To install it:

1. Copy `BeamCopy.lsp` somewhere permanent, e.g. `C:\BeamStudio\BeamCopy.lsp`
   (avoid spaces/OneDrive paths).
2. In AutoCAD, type **`APPLOAD`** and press Enter.
3. Browse to `BeamCopy.lsp`, select it, click **Load**, then **Close**.
   - You'll see `BeamCopy loaded.` on the command line.
4. **Load it automatically on every start (recommended):** in the same `APPLOAD`
   dialog, click the **Startup Suite** "Contents…" button (briefcase icon, bottom-right),
   click **Add…**, pick `BeamCopy.lsp`, **Close**. It will now load in every drawing.
5. *(Optional)* give it a hotkey: **Manage tab → CUI → Customize**, create a command
   that runs the macro `BEAMCOPY ` and drag it onto a toolbar or assign a shortcut key.

**Use it:** type `BEAMCOPY`, select objects, press Enter → switch to Beam Studio → `Ctrl+V`.

Full details and troubleshooting: [`autocad/README.md`](autocad/README.md).

---

## Building & running this repo

Prerequisites: **Node.js ≥ 24.11.1** and **pnpm**.

```bash
git clone https://github.com/hftsai/beam-studio.git
cd beam-studio
git checkout feature/autocad-direct-paste

pnpm install            # install dependencies (first time only)

# Web app (fastest way to try the paste change) -> http://localhost:8080
pnpm nx run web:start

# Electron desktop app (see Windows notes below for native build tools)
pnpm nx run app:dev     # build for development
pnpm nx run app:start   # launch

# Quality checks
pnpm nx run core:test   # unit tests for the core package
pnpm lint               # lint all projects
```

The clipboard paste change lives in `packages/core` (shared), so it applies to both the
web and Electron apps. Some machine-communication features need external services
(FLUXGhost, Swiftray) but the editor/import works without them.

### Windows first-time setup (tested on Windows 10)

If you don't have Node/pnpm yet:

```powershell
winget install OpenJS.NodeJS.LTS      # installs Node 24.x (LTS)
npm install -g pnpm                    # installs pnpm into %AppData%\npm
# open a NEW terminal so PATH picks up node + pnpm
```

Two Windows gotchas this fork already accounts for:

1. **Native module needs a C++ compiler.** `font-scanner` (used only by the Electron
   app for font discovery) compiles with node-gyp. For just the **web app**, install with
   `pnpm install --ignore-scripts` to skip it. For the **Electron** app, install the
   compiler first: `winget install Microsoft.VisualStudio.2022.BuildTools` with the
   *"Desktop development with C++"* workload, then run a plain `pnpm install`.

2. **Git symlinks don't materialize on Windows.** `apps/web/public/js/lib` and
   `apps/app/public/js/lib` are symlinks to `packages/core/public/js/lib`; Git checks
   them out as text files, so the DXF parser can't be found. Recreate them as directory
   junctions (no admin needed):

   ```powershell
   $core = "$PWD\packages\core\public\js\lib"
   foreach ($p in "apps\web\public\js\lib","apps\app\public\js\lib") {
     Remove-Item $p -Force -ErrorAction SilentlyContinue
     New-Item -ItemType Junction -Path $p -Target $core | Out-Null
   }
   ```

> **Tip:** avoid putting this repo inside Dropbox/OneDrive — they lock files during
> sync and cause `EPERM` errors mid-install. A path like `C:\dev\beam-studio` is best.

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
