# Copy from AutoCAD → Paste into Beam Studio

This adds a "copy in AutoCAD, paste in Beam Studio" workflow so you no longer
have to *Save As → pick a filename → import*. It has two parts:

1. **`BeamCopy.lsp`** — an AutoCAD command that puts your selection on the
   clipboard as DXF text.
2. **A Beam Studio change** — the paste handler now recognizes DXF text on the
   clipboard and imports it through the normal DXF pipeline.

## Why DXF text (and not "real" AutoCAD copy)?

When you press Ctrl+C in AutoCAD, it puts a *binary DWG* (a temp file) and a
Windows metafile on the clipboard — neither of which a web/Electron app can read
as vector geometry. The best a normal paste could ever recover is a raster
image, which is useless for cutting. `BeamCopy.lsp` works around this by writing
**DXF text** to the clipboard, which Beam Studio can parse into real vectors.

## Setup (AutoCAD side)

> Requires full AutoCAD. **AutoCAD LT does not support AutoLISP** — use the
> watched-folder approach instead (ask the maintainer for "Option B").

1. Copy `BeamCopy.lsp` somewhere permanent (e.g. `C:\BeamStudio\BeamCopy.lsp`).
2. Load it for the current session: type `APPLOAD`, browse to the file, **Load**.
   - To load it automatically on every start, click the **Startup Suite**
     (briefcase) button in the APPLOAD dialog and add the file.
3. (Optional) Bind it to a shortcut: in **Manage → Customize User Interface (CUI)**,
   create a command that runs `BEAMCOPY` and assign a hotkey, or just type it.

## Daily use

1. In AutoCAD: type **`BEAMCOPY`**, select the objects, press **Enter**.
   - You'll see: *"DXF copied to clipboard..."*
2. Switch to Beam Studio, click on the canvas, press **Ctrl+V**.
3. Choose the unit/DPI in the dialog that appears (same dialog as file import).

## Notes / limitations

- A console window may flash briefly when the clipboard is written — that's
  `clip.exe` doing its job.
- The DXF unit dialog appears on every paste because DXF has no reliable unit;
  pick the unit your AutoCAD drawing uses.
- Supported geometry matches Beam Studio's normal DXF import (lines, polylines,
  arcs, circles, splines, ellipses, etc.). Exotic AutoCAD objects (3D solids,
  proxy/AEC objects) won't survive — flatten/explode them first.
- The temp file is `%TEMP%\beam_clip.dxf` and is overwritten each time.
