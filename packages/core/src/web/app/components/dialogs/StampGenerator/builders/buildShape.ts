import paper from 'paper';

import NS from '@core/app/constants/namespaces';

import { DESIGN_SIZE, PREVIEW_COLORS } from '../constants';
import type { ParsedTemplate, StampShape, StampState, StampTemplate } from '../types';

import { buildBorder, holeScale, ringPath } from './buildBorder';
import { buildElementPaths } from './buildElement';
import { buildTextPaths } from './buildText';

/**
 * Outer contour of a (possibly compound) frame: the child with the largest area.
 * Cloned detached: cloning a compound's child otherwise inserts the copy back into that compound.
 */
const outerContour = (item: paper.PathItem): paper.PathItem => {
  if (!(item instanceof paper.CompoundPath)) return item.clone({ insert: false });

  const outer = (item.children as paper.Path[]).reduce((a, b) => (Math.abs(b.area) > Math.abs(a.area) ? b : a));

  return outer.clone({ insert: false });
};

/**
 * Inverted face = outline minus everything engraved, via nesting instead of boolean ops (~40ms vs
 * ~2.4s on the rect template): collect every engraved contour into one compound and `reorient` so
 * each contour's depth decides fill (glyph → hole, its counter → filled again). The outermost ring's
 * outer edge IS the cut, so it's dropped and the ring's inner edge bounds the face.
 * Assumes engraved parts don't overlap or leave the outline (templates + resolveOverlaps guarantee it).
 */
export const invertFace = (cut: paper.PathItem, engraved: paper.PathItem[]): paper.PathItem => {
  const face = new paper.CompoundPath({ insert: true });
  const cutArea = Math.abs((cut as paper.Path).area);
  const coincidesWithCut = (c: paper.Path) =>
    Math.abs(Math.abs(c.area) - cutArea) < 1e-6 * cutArea &&
    c.bounds.center.getDistance(cut.bounds.center) < 1e-6 &&
    Math.abs(c.bounds.width - cut.bounds.width) < 1e-6;
  let hasCut = false;

  for (const item of engraved) {
    // Copy: `children` is live, and re-parenting a child while iterating it would skip every other one.
    const contours = item instanceof paper.CompoundPath ? [...(item.children as paper.Path[])] : [item as paper.Path];

    for (const c of contours) {
      if (coincidesWithCut(c)) {
        hasCut = true;
        c.remove();
      } else {
        face.addChild(c);
      }
    }

    if (item instanceof paper.CompoundPath) item.remove();
  }

  if (!hasCut) face.addChild(cut.clone());

  face.reorient(false, true);

  return face;
};

/**
 * Cuts `text` out of the frame that contains it: both become one compound reoriented by containment
 * depth (frame filled → glyph hole → counter filled), the same trick as invertFace. Returns null when
 * no frame's filled region holds the text (e.g. the user enlarged it past its band): the caller then
 * engraves the text normally instead of merging it into a ring, where it would vanish.
 */
export const knockoutText = (frames: paper.PathItem[], text: paper.PathItem): null | paper.PathItem[] => {
  // Smallest frame whose filled area holds the text: the band, not the outer ring (its center is a hole).
  const index =
    frames
      .map((f, i) => ({
        area: f.bounds.area,
        contains: f.bounds.contains(text.bounds) && f.contains(text.bounds.center),
        i,
      }))
      .filter((c) => c.contains)
      .sort((a, b) => a.area - b.area)[0]?.i ?? -1;

  if (index < 0) return null;

  const contours = (item: paper.PathItem): paper.Path[] =>
    item instanceof paper.CompoundPath ? [...(item.children as paper.Path[])] : [item as paper.Path];
  const merged = new paper.CompoundPath({ children: [...contours(frames[index]), ...contours(text)], insert: true });

  merged.fillColor = frames[index].fillColor;
  // The contours were re-parented into `merged`; only the emptied compound shells are left to drop.
  for (const item of [frames[index], text]) if (item instanceof paper.CompoundPath) item.remove();

  merged.reorient(false, true);

  return frames.map((f, i) => (i === index ? merged : f));
};

/**
 * Composes engrave + cut geometry for the current state inside one paper group.
 * Frames are cloned so the parsed template stays pristine; text is converted to outlines and
 * element shapes are fitted into their slots. Built unmirrored so the preview reads naturally; the
 * export mirrors it when `flipHorizontal` is set.
 */
export const buildStampShape = async (
  parsed: ParsedTemplate,
  template: StampTemplate,
  state: StampState,
): Promise<StampShape> => {
  const group = new paper.Group();
  // Elements first: a text slot with `clearOf` lays out around the element's built bounds.
  const elementsById = await buildElementPaths(paper.project, template, state);
  const built = await buildTextPaths(parsed, template, state, elementsById);
  const elements = Object.values(elementsById);
  const texts: paper.PathItem[] = [];
  let frames = parsed.frames.map((f) => f.clone());

  if (template.border && state.border) {
    const { widthMm } = template.sizes[state.sizeIndex] ?? template.sizes[0];
    const pxPerMm = template.border.bounds.width / widthMm;
    const border = buildBorder(template.border, state.border, pxPerMm);

    // A decorative frame reaches further in than the stroke ring the design was laid out against:
    // shrink the whole design (SVG frames, text, elements) about the center to fit its hole.
    if (state.border.style !== 'stroke') {
      const { bounds } = template.border;
      const scale = holeScale(border, template.border, state.border.style, pxPerMm);
      const center = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

      [...frames, ...built.map((b) => b.item), ...elements].forEach((item) => item.scale(scale, center));
    }

    frames.push(border);
  }

  for (const { item, slot } of built) {
    const knocked = 'knockout' in slot && slot.knockout ? knockoutText(frames, item) : null;

    if (knocked) frames = knocked;
    else texts.push(item);
  }

  // A decorative border style fills its box to the corners, so its cut is the sharp box (the ellipse for
  // round families), not the stroke ring's rounded one.
  const cut =
    template.border && state.border && state.border.style !== 'stroke'
      ? ringPath(template.border.bounds, 0, template.border.shape)
      : outerContour(parsed.outline);
  const engrave = state.invertColor
    ? [invertFace(cut, [...frames, ...texts, ...elements])]
    : [...frames, ...texts, ...elements];

  group.addChildren([...engrave, cut]);

  return { bounds: cut.bounds.clone(), cut, engrave, group };
};

/** Renders the engraved face into a standalone <svg viewBox="0 0 150 150"> for the preview. */
export const buildPreviewSvg = (shape: StampShape): SVGSVGElement => {
  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('xmlns', NS.SVG);
  svg.setAttribute('viewBox', `0 0 ${DESIGN_SIZE} ${DESIGN_SIZE}`);

  const addPath = (item: paper.PathItem, attrs: Record<string, string>) => {
    const path = document.createElementNS(NS.SVG, 'path');

    path.setAttribute('d', item.pathData);
    Object.entries(attrs).forEach(([k, v]) => path.setAttribute(k, v));
    svg.appendChild(path);
  };

  shape.engrave.forEach((item) => addPath(item, { fill: PREVIEW_COLORS.engrave }));
  // Dashed cut boundary: coincides with the outer ring's edge normally, but when inverted that ring is
  // blank and the stamp's edge would vanish against the background.
  addPath(shape.cut, { fill: 'none', stroke: PREVIEW_COLORS.cut, 'stroke-dasharray': '2 1', 'stroke-width': '0.5' });

  return svg;
};
