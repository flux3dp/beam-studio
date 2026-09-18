import paper from 'paper';

import NS from '@core/app/constants/namespaces';

import { DESIGN_SIZE, PREVIEW_COLORS } from '../constants';
import type { ParsedTemplate, StampShape, StampState, StampTemplate } from '../types';

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
 * Composes engrave + cut geometry for the current state inside one paper group.
 * Frames are cloned so the parsed template stays pristine; text is converted to outlines and
 * element shapes are fitted into their slots.
 * `flipHorizontal` mirrors everything about the outline center (a stamp face is a mirror image).
 */
export const buildStampShape = async (
  parsed: ParsedTemplate,
  template: StampTemplate,
  state: StampState,
): Promise<StampShape> => {
  const group = new paper.Group();
  const frames = parsed.frames.map((f) => f.clone());
  const texts = await buildTextPaths(parsed, template, state);
  const elements = buildElementPaths(paper.project, template, state);
  const cut = outerContour(parsed.outline);
  const engrave = state.invertColor
    ? [invertFace(cut, [...frames, ...texts, ...elements])]
    : [...frames, ...texts, ...elements];

  group.addChildren([...engrave, cut]);

  if (state.flipHorizontal) group.scale(-1, 1, cut.bounds.center);

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
