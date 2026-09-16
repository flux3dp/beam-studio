import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import NS from '@core/app/constants/namespaces';
import { createTextElement, createTextPath } from '@core/helpers/generator/textElement';
import { convertTextsToPath } from '@core/helpers/generator/textToPath';

import { BOLD_OFFSET_RATIO } from '../constants';
import type { Bounds, ParsedTemplate, StampState, StampTemplate, TextSlotDef } from '../types';

/**
 * Stretches `item` so its ink bounds exactly fill `bounds` (non-uniform, like seal makers do),
 * then centers it. No-op on degenerate items.
 */
export const fitToBounds = (item: paper.Item, bounds: Bounds): void => {
  const { height, width } = item.bounds;

  if (width <= 0 || height <= 0) return;

  item.scale(bounds.width / width, bounds.height / height);
  item.position = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
};

/**
 * Letter spacing that makes text of `measuredLength` (at `currentSpacing`) span `targetLength`,
 * spreading the difference over `gaps`. With `tightenOnly`, text that already fits is left alone.
 */
export const fitLetterSpacing = (
  measuredLength: number,
  targetLength: number,
  gaps: number,
  currentSpacing: number,
  tightenOnly = true,
): number => {
  if (gaps <= 0 || (tightenOnly && measuredLength <= targetLength)) return currentSpacing;

  return currentSpacing + (targetLength - measuredLength) / gaps;
};

/** Runs `fn` with the text (and optional reference path) mounted off-screen so DOM measurement works. */
const withMounted = <T>(textEl: SVGTextElement, refPath: null | SVGPathElement, fn: () => T): T => {
  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.style.visibility = 'hidden';
  svg.style.position = 'absolute';

  if (refPath) svg.appendChild(refPath);

  svg.appendChild(textEl);
  document.body.appendChild(svg);

  try {
    return fn();
  } finally {
    svg.remove();
  }
};

/** Rewrites letter-spacing so the (first line of) text spans `targetLength`. */
const fitTextByLetterSpacing = (
  textEl: SVGTextElement,
  targetLength: number,
  gaps: number,
  spacing: number,
  tightenOnly: boolean,
): void =>
  withMounted(textEl, null, () => {
    const measured = (textEl.querySelector('tspan') ?? textEl).getComputedTextLength();
    const fitted = fitLetterSpacing(measured, targetLength, gaps, spacing, tightenOnly);

    if (fitted !== spacing) textEl.setAttribute('letter-spacing', String(fitted));
  });

/**
 * Shrinks the font size until text-on-path fits its arc (so glyphs never overlap or run off the
 * end), and returns the vertical glyph scale that restores the intended height.
 */
const fitTextToArc = (textEl: SVGTextElement, refPath: SVGPathElement, arcLength: number, fontSize: number): number =>
  withMounted(textEl, refPath, () => {
    let size = fontSize;

    // Letter spacing is absolute, so one proportional step may leave a remainder; a couple converge.
    for (let i = 0; i < 3; i += 1) {
      const measured = textEl.getComputedTextLength();

      if (measured <= arcLength) break;

      size *= arcLength / measured;
      textEl.setAttribute('font-size', String(size));
    }

    return fontSize / size;
  });

/** Faux bold: offsets glyph outlines outward by a fraction of the font size. */
const embolden = (item: paper.PathItem, fontSize: number): paper.PathItem => {
  if (!(item instanceof paper.Path || item instanceof paper.CompoundPath)) return item;

  const bold = PaperOffset.offset(item, fontSize * BOLD_OFFSET_RATIO, { insert: true, join: 'round' });

  item.remove();

  return bold;
};

const toPathItem = (pathEl: SVGPathElement | undefined): null | paper.PathItem => {
  const d = pathEl?.getAttribute('d');

  return d ? new paper.CompoundPath(d) : null;
};

/**
 * Builds one paper path item per enabled text slot, with glyphs already converted to outlines
 * via fontkit so preview and export share the same geometry.
 */
export const buildTextPaths = async (
  parsed: ParsedTemplate,
  template: StampTemplate,
  state: StampState,
): Promise<paper.PathItem[]> => {
  const items: paper.PathItem[] = [];

  for (const slot of template.texts) {
    const values = state.texts[slot.id];

    if (!values?.enabled || !values.text.trim()) continue;

    const item = await buildTextSlot(parsed, slot, values);

    if (item) items.push(item);
  }

  return items;
};

const buildTextSlot = async (
  parsed: ParsedTemplate,
  slot: TextSlotDef,
  values: StampState['texts'][string],
): Promise<null | paper.PathItem> => {
  const { bold, font, letterSpacing, lineSpacing, text } = values;

  if ('baseline' in slot) {
    const baseline = parsed.baselines[slot.baseline];

    if (!baseline) return null;

    const pathId = `stamp-baseline-${slot.id}`;
    const line = slot.offset ? PaperOffset.offset(baseline, slot.offset, { insert: false }) : baseline;
    const { refPath, textEl } = await createTextPath(text, font, slot.fontSize, letterSpacing, line.pathData, pathId);

    const glyphScaleY = fitTextToArc(textEl, refPath, line.length, slot.fontSize);

    if (line !== baseline) line.remove();

    const [pathEl] = await convertTextsToPath([textEl], [refPath], { glyphScaleY });
    const item = toPathItem(pathEl);

    return item && bold ? embolden(item, slot.fontSize) : item;
  }

  // ponytail: vertical (column) text lands in chunk 6; until then those slots are skipped.
  if (slot.vertical) return null;

  const { bounds } = slot;
  const textEl = await createTextElement(text, font, bounds.height, letterSpacing, lineSpacing, bounds);
  const fit = slot.fit ?? 'spacing';

  // Glyphs keep their shape; letter spacing grows or shrinks so the line spans the box width.
  if (fit === 'spacing') fitTextByLetterSpacing(textEl, bounds.width, text.length - 1, letterSpacing, false);

  const [pathEl] = await convertTextsToPath([textEl]);
  let item = toPathItem(pathEl);

  if (!item) return null;

  if (bold) item = embolden(item, bounds.height);

  if (fit === 'stretch') fitToBounds(item, bounds);
  else item.position = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

  return item;
};
