# BeamCopy — Copy from AutoCAD → Paste into Beam Studio

`BeamCopy.lsp` adds a "copy in AutoCAD, paste in Beam Studio" workflow so you no
longer have to *Save As → pick a filename → import*. It puts the selected
objects on the Windows clipboard as **DXF text**; Beam Studio's paste handler
recognizes DXF text and imports it through the normal DXF pipeline.

> This file is kept here as the version-controlled source of truth. It is **not**
> bundled into the application build by default — it is distributed to users via
> the FLUX help center. Edit here when the script needs a fix or revision.

## Attribution & license

Authored by **Paul Hsieh-Fu Tsai (蔡協孚)**, Assistant Professor, Dept. of
Biomedical Engineering, Chang Gung University, Taiwan. Contributed to FLUX in
[PR #904](https://github.com/flux3dp/beam-studio/pull/904) and distributed under
the **MIT License** (see the header in `BeamCopy.lsp`).

## Why DXF text (and not a "real" AutoCAD copy)?

When you press Ctrl+C in AutoCAD it puts a *binary DWG* (a temp file) and a
Windows metafile on the clipboard — neither of which a web/Electron app can read
as vector geometry. The best a normal paste could recover is a raster image,
which is useless for cutting. `BeamCopy.lsp` works around this by writing **DXF
text** to the clipboard, which Beam Studio can parse into real vectors.

## Setup (AutoCAD side)

> Requires full AutoCAD. **AutoCAD LT does not support AutoLISP.**

1. Copy `BeamCopy.lsp` somewhere permanent (e.g. `C:\BeamStudio\BeamCopy.lsp`).
2. Load it for the current session: type `APPLOAD`, browse to the file, **Load**.
   - To load it automatically on every start, click the **Startup Suite**
     (briefcase) button in the APPLOAD dialog and add the file.
3. (Optional) Bind it to a shortcut via **Manage → Customize User Interface
   (CUI)**, or just type the command.

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
