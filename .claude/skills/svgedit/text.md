# SVG Text Editing System

Location: `packages/core/src/web/app/svgedit/text/`

## Overview

The text system handles three types of text elements:

| Type | SVG structure | Creation mode | Key attribute |
|------|--------------|---------------|---------------|
| **Multi-line text** | `<text>` with `<tspan>` children | Click (`text` mode) | — |
| **FitText** | `<text data-fit-text="true">` with `<tspan>` children | Click-to-create (`fit-text` mode) | `data-fit-text="true"` |
| **Text-on-path** | `<g data-textpath-g>` wrapping `<text data-textpath>` with `<textPath>` child | Separate flow | `data-textpath` |

All text content uses `\u0085` as the internal line separator (in the hidden `#text` input and `renderText` val parameter). The `<tspan>` children each hold one line's text content.

## File Structure

```
text/
├── textedit/            # Attribute getters, setters, and rendering
│   ├── index.ts         # Re-exports + default export for backward compat
│   ├── curText.ts       # Current text defaults (font family, size, etc.)
│   ├── getters.ts       # Read-only attribute getters (font, spacing, fitText)
│   ├── setters.ts       # Attribute setters with undo support
│   └── renderText.ts    # Rendering: renderTspan, renderFitTextTspan, renderTextPath
├── textactions.ts       # In-place canvas editing (cursor, selection, keyboard)
├── createNewText.ts     # Creates new multi-line text elements
└── fitText.ts           # Creates new fitText elements + resize transform handler
```

## Text Element Attributes

### Common attributes (all text types)

| Attribute | Example | Description |
|-----------|---------|-------------|
| `font-family` | `'Arial'` | Font family (quoted) |
| `font-postscript` | `ArialMT` | PostScript name for font matching |
| `font-size` | `100` | Font size in SVG units |
| `font-weight` | `400` | Font weight |
| `font-style` | `italic` / `normal` | Italic toggle |
| `letter-spacing` | `0.1em` | Letter spacing (em units) |
| `data-line-spacing` | `1` | Line spacing multiplier |
| `data-verti` | `true` / `false` | Vertical text mode |
| `data-ratiofixed` | `true` / `false` | Aspect ratio lock on resize |
| `xml:space` | `preserve` | Whitespace preservation |

### FitText-specific attributes

| Attribute | Example | Description |
|-----------|---------|-------------|
| `data-fit-text` | `1` | Marks element as fitText |
| `data-fit-text-size` | `200` | Wrapping constraint (width in horizontal, column height in vertical) |
| `data-fit-text-align` | `start` / `middle` / `end` / `justify` | Single source of truth for alignment |

### FitText tspan attributes

| Attribute | On | Description |
|-----------|-----|-------------|
| `data-wrapped` | `<tspan>` | `"1"` on auto-wrapped continuation tspans (not on the first tspan of a manual line) |

### Text-on-path attributes

| Attribute | On | Description |
|-----------|-----|-------------|
| `data-textpath-g` | `<g>` | Marks the wrapper group |
| `data-textpath` | `<text>` | Marks the text element inside the group |

## textedit/ Module

### curText.ts — Default text config

Holds the current text attribute defaults (`TextAttribute`), used when creating new text elements. Syncs with `storageStore['default-font']` and `TabEvents.ReloadSettings`.

### getters.ts — Read-only attribute access

All functions take `(elem: SVGTextElement)` and return the attribute value:

- `getFontFamily`, `getFontFamilyData`, `getFontPostscriptName`
- `getFontSize`, `getFontWeight`, `getItalic`
- `getLetterSpacing`, `getLineSpacing`, `getIsVertical`
- `isFitText(elem)` — checks `data-fit-text === 'true'`
- `getFitTextSize(elem)` — reads `data-fit-text-size`
- `getFitTextAlign(elem)` — reads `data-fit-text-align`, defaults to `'start'`
- `getTextContent(elem)` — extracts text from `<tspan>` children, merging consecutive wrapped tspans (`data-wrapped="1"`) into single manual lines, joined by `\n`

### setters.ts — Attribute modification

Most setters use `svgCanvas.changeSelectedAttribute` for undo integration. Some use `changeAttribute()` helper for direct attribute changes with `ChangeElementCommand`.

Key exports:
- `setFontFamily`, `setFontPostscriptName`, `setFontSize`, `setFontWeight`, `setItalic`
- `setLetterSpacing`, `setLineSpacing`, `setIsVertical`
- `setTextContent(val)` — re-renders selected element with new text, emits `textContentEvents.emit('changed')`
- `setFitTextAlign(text, align)` — changes alignment with undo, recalculates x position for horizontal mode
- `textContentEvents` — EventEmitter (`'text-content'`) for real-time sync between canvas editing and the right panel textarea

### renderText.ts — Text rendering

`renderText(elem, val?, showGrips?)` is the central rendering dispatch:

1. **Text-on-path** → `renderTextPath`: sets `textPath.textContent`
2. **FitText** → `renderFitTextTspan`: handles compression and alignment
3. **Multi-line** → `renderTspan`: positions tspans based on line spacing

After rendering, always calls `svgedit.recalculate.recalculateDimensions(elem)`.

#### renderTspan (multi-line)

- Splits `val` by `\u0085` into lines
- Creates/removes `<tspan>` elements to match line count
- **Horizontal**: sets each tspan's `x` = text's `x`, `y` = text's `y` + line index * lineSpacing * fontSize
- **Vertical**: sets per-character `x`/`y` positions, columns go right-to-left

#### renderFitTextTspan (fitText)

Uses character-boundary auto-wrap. Font size stays fixed (user-controlled). All existing tspans are removed and rebuilt each render.

- **Horizontal mode**:
  - Width fixed to `data-fit-text-size`
  - For each manual line: measures text width, uses binary search to find character break point
  - Creates additional tspans with `data-wrapped="1"` for continuation lines
  - Each visual line positioned at `y = baseY + visualLineIndex * lineSpacing * fontSize`
  - Sets `text-anchor` from `data-fit-text-align` (maps `justify` → `start`)
- **Vertical mode**:
  - Height fixed to `data-fit-text-size`
  - Calculates chars per column: `floor((boxHeight - charHeight) / charSpacing) + 1`
  - Splits into sub-columns with `data-wrapped="1"` on continuations
  - Columns positioned right-to-left
  - Removes `text-anchor` attribute to avoid horizontal shift

## textactions.ts — In-place Canvas Editing

`TextActions` is a singleton class managing the in-place text editing experience on the canvas.

### Key state

- `isEditing` — whether text edit mode is active
- `curtext` — the SVG text element being edited
- `textinput` — hidden HTML `<input id="text">` element (always present in DOM, set via `setInputElem`)
- `chardata` — 2D array of character bounding boxes `[row][charIndex]` for cursor/selection positioning
- `valueBeforeEdit` — stored on `toEditMode` for undo comparison

### Lifecycle

1. **Enter edit mode**: `start(elem)` or `select(elem)` → sets `curtext`, reads tspans into `textinput.value` (joined by `\u0085`, merging wrapped tspans for fitText), calls `toEditMode()`
2. **toEditMode**: sets `isEditing = true`, changes mouse mode to `textedit`, stores `valueBeforeEdit`, shows selector, initializes chardata
3. **Editing**: keyboard events on `#text` input trigger `setTextContent(textinput.value)` which re-renders the SVG
4. **toSelectMode**: sets `isEditing = false`, creates `ChangeTextCommand(curtext, oldText, newText)` if text changed, handles empty text deletion, restores mouse mode

### Mouse interaction in textedit mode

- `mouseDown` → positions cursor at click point
- `mouseMove` → extends text selection
- `mouseUp` → finalizes selection; exits to select mode if click was outside text

### Cursor and selection

- Cursor: SVG `<line id="text_cursor">` in selectorParentGroup, blinks every 600ms
- Selection block: SVG `<path id="text_selectblock">` with green fill
- `chardata` computed from `tspan.getStartPositionOfChar()` / `getEndPositionOfChar()`
- For fitText: `calculateChardata` groups tspans by manual line (using `data-wrapped`), collecting char positions from all visual tspans in each group into one `chardata` row per manual line

### Keyboard handling (in svg-editor.ts)

The `#text` input's keyboard events are handled in `svg-editor.ts`:
- `keyup`/`input` → calls `textEdit.setTextContent(this.value)` for live rendering
- `Enter` → `textActions.newLine()` then `setTextContent`
- `Escape` → `textActions.toSelectMode()`
- `Cmd/Ctrl+C/X/V/A` → copy/cut/paste/selectAll via `textActions` methods

## createNewText.ts — Multi-line Text Creation

`createNewText(x, y, options)` creates a `<text>` element at the given position using current font defaults from `curText`. Optionally adds to history and emits `canvasEvents.emit('addText')`.

Mouse mode `'text'`: click creates the element at mouseDown position, then immediately enters `textActions.start()` at mouseUp.

## fitText.ts — FitText Creation and Transform

### createNewFitText(boxX, boxY, width, options)

Creates a fitText element via click-to-create:
- `font-size` = `curText.font_size` (user's current default)
- `data-fit-text-size` = width (default: fontSize × 10)
- Default `data-fit-text-align` = `'middle'`
- `x` = boxX + width/2 (centered for middle alignment)
- `y` = boxY + fontSize (SVG baseline)
- `data-ratiofixed` = `false` (allows non-proportional resize)
- Height is dynamic — computed from tspan count, not stored as an attribute

Mouse mode `'fit-text'`: click creates element at mouse position with default width.

### handleFitTextTransform(text, initBBox)

Called after resize (in mouseUp) to recalculate fitText attributes from the transform:
- Font size stays **unchanged** — only the wrapping constraint updates
- Updates `data-fit-text-size` from the resized bbox (width in horizontal, height in vertical)
- Recalculates `x`/`y` based on alignment and vertical mode
- Strips non-rotate transforms from the transform list
- Re-renders text (which re-wraps to new dimensions)

### FitText sizing rules

FitText has one stored constraint (`data-fit-text-size`) and one dynamic dimension:

- **Horizontal**: `width` = `data-fit-text-size` (fixed wrapping constraint). Height is dynamic, computed from the number of visual tspans × fontSize × lineSpacing.
- **Vertical**: `height` = `data-fit-text-size` (fixed column height constraint). Width is dynamic, computed from the number of columns × fontSize × lineSpacing.

## getBBox for FitText

`svgedit/utils/getBBox.ts` overrides native getBBox for fitText. Height/width of the dynamic dimension is computed from tspan count:
- **Horizontal**: `bbox.x` and `bbox.width` from `x` attribute and `data-fit-text-size` (adjusted by `data-fit-text-align`). `bbox.y = y - fontSize`, `bbox.height = fontSize * (1 + (tspanCount - 1) * lineSpacing)`.
- **Vertical**: `bbox.y` and `bbox.height` from `y` attribute and `data-fit-text-size`. `bbox.width = fontSize * (1 + (tspanCount - 1) * lineSpacing)`, `bbox.x = x + fontSize - dynamicWidth`.

## Right Panel Integration (TextContentBlock)

`TextOptions/components/TextContentBlock.tsx` provides a textarea in the right panel for editing text content:
- Shows for non-text-path elements with a single text element selected (also during creation)
- Displays text with `\n` line breaks (converted from `\u0085` internal format)
- On change: converts `\n` → `\u0085` and calls `renderText()` for live preview
- On blur: creates `ChangeTextCommand` for undo if text changed since focus
- Subscribes to `textContentEvents` for real-time sync when canvas editing updates the text

## Undo/Redo

| Command | Used for |
|---------|----------|
| `ChangeTextCommand(elem, oldText, newText)` | Text content changes (canvas editing via textactions, panel textarea) |
| `ChangeElementCommand(elem, oldAttrs)` | Attribute changes (alignment, vertical toggle) via `changeAttribute()` |
| `BatchCommand` | Grouped operations (font family change, edit text session) |
| `InsertElementCommand(elem)` | New text element creation |

## Event Flow

### Canvas text editing
```
User double-clicks text → textActions.start(elem)
  → setInputValueFromCurtext() (tspans → \u0085 joined → textinput.value)
  → toEditMode() (isEditing=true, store valueBeforeEdit)
  → User types in hidden #text input
  → svg-editor.ts keyup/input handler → textEdit.setTextContent(value)
    → renderText(elem, val) → re-render tspans
    → textContentEvents.emit('changed') → TextContentBlock syncs
  → User clicks outside / presses Escape → toSelectMode()
    → ChangeTextCommand(elem, oldText, newText) → undoManager
```

### Panel textarea editing
```
User focuses textarea → store valueBeforeEdit
  → User types in textarea
  → onChange: renderText(elem, val) for live preview
  → User blurs textarea
  → ChangeTextCommand(elem, oldText, newText) → undoManager
```
