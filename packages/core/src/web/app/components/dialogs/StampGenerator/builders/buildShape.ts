import paper from 'paper';

import NS from '@core/app/constants/namespaces';

import { DESIGN_SIZE } from '../constants';
import type { ParsedTemplate, StampShape, StampState, StampTemplate } from '../types';

import { buildElementPaths } from './buildElement';
import { buildTextPaths } from './buildText';

/** Outer contour of a (possibly compound) frame: the child with the largest area. */
const outerContour = (item: paper.PathItem): paper.PathItem => {
  if (!(item instanceof paper.CompoundPath)) return item.clone();

  const outer = (item.children as paper.Path[]).reduce((a, b) => (Math.abs(b.area) > Math.abs(a.area) ? b : a));

  return outer.clone();
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
  const engrave = [...frames, ...texts, ...elements];

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

  shape.engrave.forEach((item) => addPath(item, { fill: '#000' }));

  return svg;
};
