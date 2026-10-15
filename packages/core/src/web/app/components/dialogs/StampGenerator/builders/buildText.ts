import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import NS from '@core/app/constants/namespaces';
import { createTextElement, createTextPath } from '@core/helpers/generator/textElement';
import { convertTextsToPath } from '@core/helpers/generator/textToPath';

import type { Bounds, ParsedTemplate, StampState, StampTemplate, TextSlotDef } from '../types';

import { resolveOverlaps } from './resolveOverlaps';

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

const toPathItem = (pathEl: SVGPathElement | undefined): null | paper.PathItem => {
  const d = pathEl?.getAttribute('d');

  return d ? resolveOverlaps(new paper.CompoundPath(d)) : null;
};

/**
 * Trims `box` so it stays `padding` away from `obstacle` on the side the obstacle's center is, when
 * the two overlap vertically. Returns the box unchanged otherwise or if nothing would be left.
 */
export const keepClear = (box: Bounds, obstacle: Bounds, padding: number): Bounds => {
  const overlapsRows = obstacle.y < box.y + box.height && obstacle.y + obstacle.height > box.y;

  if (!overlapsRows) return box;

  const onLeft = obstacle.x + obstacle.width / 2 < box.x + box.width / 2;
  const x = onLeft ? Math.max(box.x, obstacle.x + obstacle.width + padding) : box.x;
  const right = onLeft ? box.x + box.width : Math.min(box.x + box.width, obstacle.x - padding);

  return right - x > 0 ? { ...box, width: right - x, x } : box;
};

/**
 * Builds one paper path item per enabled text slot, with glyphs already converted to outlines
 * via fontkit so preview and export share the same geometry. `elements` (built element items by
 * slot id) lets `clearOf` slots lay out around an icon's actual size.
 */
export const buildTextPaths = async (
  parsed: ParsedTemplate,
  template: StampTemplate,
  state: StampState,
  elements: Record<string, paper.PathItem> = {},
): Promise<Array<{ item: paper.PathItem; slot: TextSlotDef }>> => {
  const items: Array<{ item: paper.PathItem; slot: TextSlotDef }> = [];

  for (const slot of template.texts) {
    const values = state.texts[slot.id];

    if (!values?.enabled || !values.text.trim()) continue;

    const obstacle = 'clearOf' in slot && slot.clearOf ? elements[slot.clearOf.elementId]?.bounds : undefined;
    const laidOut =
      'bounds' in slot && obstacle && slot.clearOf
        ? { ...slot, bounds: keepClear(slot.bounds, obstacle, slot.clearOf.padding) }
        : slot;
    const item = await buildTextSlot(parsed, laidOut, values);

    if (item) items.push({ item, slot });
  }

  return items;
};

const buildTextSlot = async (
  parsed: ParsedTemplate,
  slot: TextSlotDef,
  values: StampState['texts'][string],
): Promise<null | paper.PathItem> => {
  const { font, letterSpacing, lineSpacing, text } = values;

  if ('baseline' in slot) {
    const baseline = parsed.baselines[slot.baseline];

    if (!baseline) return null;

    const pathId = `stamp-baseline-${slot.id}`;
    const { fontSize } = values;
    const line = slot.offset ? PaperOffset.offset(baseline, slot.offset, { insert: false }) : baseline;
    const { refPath, textEl } = await createTextPath(text, font, fontSize, letterSpacing, line.pathData, pathId);

    // Center the glyphs' em box on the arc so font size changes grow the text symmetrically.
    const textPath = textEl.querySelector('textPath');

    textPath?.setAttribute('alignment-baseline', 'central');
    textPath?.setAttribute('dominant-baseline', 'central');

    const glyphScaleY = fitTextToArc(textEl, refPath, line.length, fontSize);

    if (line !== baseline) line.remove();

    const [pathEl] = await convertTextsToPath([textEl], [refPath], { glyphScaleY });

    return toPathItem(pathEl);
  }

  const { bounds } = slot;
  // A vertical column is one character per line, stacked at 1em; its fit mode then sizes the stack.
  const content = slot.vertical ? [...text.replace(/\s+/g, '')].join('\n') : text;
  // Slots with an explicit template font size are user-adjustable; the rest are sized by their box.
  const fontSize = slot.fontSize === undefined ? (slot.vertical ? bounds.width : bounds.height) : values.fontSize;
  const textEl = await createTextElement(
    content,
    font,
    fontSize,
    letterSpacing,
    slot.vertical ? 1 : lineSpacing,
    bounds,
  );
  const fit = slot.fit ?? 'spacing';

  // Glyphs keep their shape; letter spacing grows or shrinks so the line spans the box width.
  if (fit === 'spacing') {
    fitTextByLetterSpacing(textEl, bounds.width, content.split('\n')[0].length - 1, letterSpacing, false);
  }

  const [pathEl] = await convertTextsToPath([textEl]);
  const item = toPathItem(pathEl);

  if (!item) return null;

  if (fit === 'stretch') {
    fitToBounds(item, bounds);
  } else {
    // Overlong lines shrink uniformly, floored at half size so the text stays legible (design prototype rule).
    const [size, limit] = slot.vertical ? [item.bounds.height, bounds.height] : [item.bounds.width, bounds.width];

    if (fit === 'shrink' && size > limit) item.scale(Math.max(0.5, limit / size));

    item.position = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  }

  return item;
};
