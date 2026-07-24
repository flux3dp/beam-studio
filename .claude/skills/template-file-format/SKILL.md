---
name: template-file-format
description: The .beam binary container — block types including the 0x05 custom-thumbnail block, the template metadata flag, thumbnail management, and importable target layers. Use when changing beam-file-helper.ts, file/export handlers, FileThumbnail/, or templateTargetLayer.
---

# .beam Template File Format

## Purpose

`.beam` is Beam Studio's own binary container: signature, a JSON metadata header, then a
sequence of typed blocks. Template support added a `template` flag to the metadata, a new
block type `0x05` for author-curated thumbnails, and a `data-template-target` attribute on
layers marking which layers a consumer may import into.

## File Locations

- `packages/core/src/web/helpers/beam-file-helper.ts` — read/write the container (format doc in the header comment)
- `packages/core/src/web/helpers/file/export/utils/beam.ts` — `generateBeamBuffer` (the app-level entry point)
- `packages/core/src/web/helpers/file/export/handlers/` — `save.ts`, `cloud.ts`
- `packages/core/src/web/app/components/FileThumbnail/` — thumbnail store, UI, export helper
- `packages/core/src/web/helpers/layer/templateTargetLayer.tsx` — importable target layers
- `packages/core/src/web/app/svgedit/currentFileManager.ts` — `templateFileBlob` / `setTemplateFile`
- `packages/core/src/web/app/svgedit/resetTemplate.ts` — restore the template to its as-opened state

## Container Layout

```
signature      'B','e','a','m', 0x02        (5 bytes; version byte is still 2)
headerSize     VINT
header         metaDataLen VINT
               metaData    JSON string
               svgContentBlockLen     VINT
               imageSourceBlockLen    VINT
               thumbnailBlockLen      VINT
               miscDataBlockLen       VINT
               thumbnailsListBlockLen VINT   ← only present when block 0x05 is written
blocks         0x01 svg content
               0x02 image sources
               0x03 thumbnail        (optional)
               0x04 misc data (JSON)
               0x05 custom thumbnails (optional)
terminator     0x00
```

Every block is `type(1 byte) + length(VINT) + payload`, which is what lets `readBeamFileInfo`
walk blocks generically.

### Metadata

```ts
interface MetaData {
  contents: number[];   // e.g. [1,2,3,4] or [1,2,3,4,5]
  template: boolean;    // ← template flag
  version: string;      // window.FLUX.version
}
```

`readHeader()` returns `Partial<MetaData>` (or `{}` if the JSON fails to parse) and reads the
length VINTs positionally — it does **not** consult `contents`. The trailing thumbnailsList
length is simply never read, which is why omitting it is safe.

### Block 0x05 — custom thumbnails

```
type    0x05                (1 byte)
length  VINT                (size of everything below)
count   VINT                (number of thumbnails)
repeat count times:
  keyLen     VINT           (UTF-8 byte length)
  key        keyLen bytes
  visible    1 byte         (0 / 1)
  imageLen   VINT
  image      imageLen bytes (PNG/JPEG, may be 0 for the 'preview' entry)
```

Written by `generateThumbnailsListBlockBuffer(thumbnails: ExportThumbnail[])`, read in both
`readBlocks` (block 5 branch → `addThumbnail`) and `readBeamFileInfo` (→ `IFileThumbnail[]`).

> **Block order matters.** `readBlocks`'s 0x05 branch calls `addThumbnail()` directly and relies
> on the 0x01 branch having already run `importBvgString()`, which internally calls
> `resetThumbnails()`. If 0x05 ever precedes 0x01, the imported thumbnails are wiped.

### Backward compatibility

The signature version byte was **not** bumped for 0x05. Older readers hit block 5, log
`Unknown Block Type`, and set `currentOffset = -1`, stopping the read — which is harmless only
because 0x05 is written last, after blocks 1–4 have already been consumed.

## Writing

### `generateBeamBuffer` (app level)

```ts
generateBeamBuffer({ silent?: boolean, templateMode?: boolean }): Promise<Buffer>
```

When the interaction mode is **not** `editor` it runs the template-authoring prompts first:

```ts
if (!isInteractionMode('editor')) {
  if (!silent) await askToEditTargetLayers();      // which layers may be imported into
  thumbnailsList = await getThumbnailsForExport(!silent);  // curate thumbnails
}
```

Then collects image sources, the SVG string, and a generated preview thumbnail
(`generateBeamThumbnail()` — bbox-cropped, longest side 300px, symbols switched to origin form,
serialized with the live `<defs>`), and hands everything to `beamFileHelper.generateBeamBuffer`.

`silent: true` skips both prompts — used by the template preview iframe flow
(see [[template-modes]]).

### `beamFileHelper.generateBeamBuffer` (container level)

```ts
generateBeamBuffer(
  svgString, imageSources, thumbnail?, thumbnailsList?,
  isTemplateFile = !!currentFileManager.templateFileBlob,
): Buffer
```

The default for `isTemplateFile` means a plain re-save of an already-open template keeps its
template flag without the caller passing anything.

### Template state on save

`currentFileManager.setTemplateFile(fileBlob, isNewFile = false)`:

```ts
const isTemplateMode = !!fileBlob && (isNewFile || !!this.templateFileBlob);
this.templateFileBlob = isTemplateMode ? fileBlob : null;
setTemplateMode(isTemplateMode);          // flips the app into / out of template mode
templateEventEmitter.emit('TEMPLATE_FILE_CHANGED');
```

Note it never reads a template *value* — only "is this establishing template status fresh"
(`isNewFile`) versus "inherit the current status". Call sites pass
`opts?.templateMode !== undefined` for `isNewFile`, so passing `templateMode: false`
explicitly still results in template mode being turned **on** while the file metadata records
`template: false`. Treat that expression as suspect when touching `save.ts` / `cloud.ts`.

`templateFileBlob` retains the whole `.beam` blob for the session so `resetTemplate()` can
re-read it and restore the template to its as-opened state.

## Reading

### `readBeam(file)`

Reads the header, then:

```ts
currentFileManager.setTemplateFile(metadata.template ? file.slice() : null, true);
```

and walks the blocks. Block 0x01 goes through
`importBvgString(svgString, { clearTemplateMode: false, parentCmd })` — the `clearTemplateMode`
flag exists precisely so loading a `.beam` from inside `readBeam` doesn't undo the template mode
that was just established.

### `readBeamFileInfo(file, { getThumbnails?, templateOnly? })`

Light-weight scan for the welcome-page file lists. Returns
`{ thumbnail, thumbnails: IFileThumbnail[], workarea }`.

- `templateOnly: true` → parse the header and bail out with empty results unless
  `metaData.template` is set (used by `TabTemplateFiles.tsx`)
- `getThumbnails: false` → stop at the first 0x03 block (used by `TabRecentFiles.tsx`)

> Both the main `thumbnail` and every custom thumbnail `src` are returned as
> `URL.createObjectURL(...)` object URLs and are never revoked. They also cannot be persisted
> (they die with the document), unlike the `data:` URL this function used to return.

Neither 0x05 reader validates remaining buffer length before each read, so a truncated file
throws `RangeError` rather than a readable error.

## Thumbnail Management

`app/components/FileThumbnail/utils.ts` holds the thumbnail state as **module-level mutable
globals** plus a `'thumbnail'` event emitter (the file's own first line reads
`// Convert to a store?`):

```ts
export const thumbnailsData: { [key: string]: ThumbnailInfo }   // key → { blob, src, isVisible, isPreview, isVisibleDisabled }
export const thumbnails: string[]                                // ordered keys
export const previewThumbnailKey = 'preview'
```

| Function | Notes |
|---|---|
| `resetThumbnails()` | revokes object URLs, clears both containers, re-seeds `thumbnailsData['preview']`. **Does not push `'preview'` into `thumbnails`** — only `refreshPreview()` does. Called at module load, from `svg-editor.ts` on new file, and from `importBvg.ts`. |
| `refreshPreview()` | `switchImageSymbolForAll(false)` → `generateThumbnail()` → `switchImageSymbolForAll(true)`. No try/finally, no concurrency guard. |
| `addThumbnail(blob, { key?, isVisible?, src? })` | default key is `` `thumbnail-${Date.now()}` `` — collides within the same millisecond. |
| `removeThumbnail(key)` | refuses to remove the preview entry. |
| `togglePreviewVisibility()` | |
| `reorderThumbnails(from, to)` | plain splice; the preview entry is not pinned to index 0. |

Subscribe with `onThumbnailDataChange(key, cb)` / `onThumbnailOrderChange(cb)`.

`getThumbnailsForExport(askUser)` (`getThumbnailsForExport.tsx`) optionally shows the
"edit thumbnails?" modal, then converts each entry's blob to an `ArrayBuffer`. The preview
entry is always exported with `data: null` — the reader recreates it from block 0x03.

> The modal promise is only resolved from the dialog's `onClose`. If the dialog is dismissed by
> any other route the promise never settles and `generateBeamBuffer` hangs, silently aborting
> the save. The same shape exists in `askToEditTargetLayers`.

UI: `ThumbnailList.tsx` (dnd-kit sortable grid, max 10 + the preview entry),
`Thumbnail.tsx`, `ThumbnailCarousel.tsx`, `AddButton.tsx` (JPG/PNG, ≤1 MB, ≤800×600).

## Importable Target Layers

`helpers/layer/templateTargetLayer.tsx` marks which layers a consumer may import content into,
via a `data-template-target` attribute on the layer `<g>` holding a label:

```ts
getTargetLayers(): TemplateTargetLayer[]   // { label, layerG, value: layer.getName() }
isImportable(layers?): boolean             // any layer has a label
askToEditTargetLayers(): Promise<void>     // alert → TemplateTargetSettingModal → setTargetLayers
determineTargetLayer(): Promise<string|null>  // 0 → throws, 1 → auto, N → radio dialog
```

`skippedModules` layers are excluded from the candidate list.

Caveats worth knowing: `setTargetLayers` writes the attribute directly with no undo command and
without marking the file dirty; the mapping key is the layer **name**, so renaming a layer
breaks it; `determineTargetLayer` throws a bare non-localized `Error` when nothing is marked.

`templateEventEmitter` (created here, name `'template'`) is also what `currentFileManager`
emits `'TEMPLATE_FILE_CHANGED'` on.

## Reset

```ts
resetTemplate()  // re-reads currentFileManager.templateFileBlob through readBeam
```

Wired to the reset button that replaces the layer-panel button in the SvgEditor floating
toolbar while in template modes. It opens a non-stop progress overlay with no try/finally, so a
failed read leaves the overlay up.

## Related

- [[template-modes]] — what `template: true` switches on in the app
- [[content-library]] — library symbols travel inside block 0x01/0x02 like any other defs content
