import type paper from 'paper';

import NS from '@core/app/constants/namespaces';

import { EXPLODED_GAP_PX, KEYCHAIN_COLORS, type KeychainViewMode } from '../constants';

interface BuildKeychainViewParams {
  bounds: paper.Rectangle;
  decorations: SVGElement[];
  defaultViewBox: { height: number; width: number; x: number; y: number };
  innerPath: null | paper.PathItem;
  resultBasePath: paper.PathItem;
}

/**
 * Computes the design viewBox by clamping the result bounds against the category's
 * default viewBox with a 5px padding (matches the previous applyOptions behaviour).
 */
const computeDesignViewBox = (
  bounds: paper.Rectangle,
  defaultViewBox: { height: number; width: number; x: number; y: number },
): { height: number; width: number; x: number; y: number } => {
  const left = Math.min(bounds.x - 5, defaultViewBox.x);
  const top = Math.min(bounds.y - 5, defaultViewBox.y);
  const right = Math.max(bounds.x + bounds.width + 5, defaultViewBox.x + defaultViewBox.width);
  const bottom = Math.max(bounds.y + bounds.height + 5, defaultViewBox.y + defaultViewBox.height);

  return { height: bottom - top, width: right - left, x: left, y: top };
};

const createPathElement = (d: string, stroke: string): SVGPathElement => {
  const path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;

  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', '1');
  path.setAttribute('vector-effect', 'non-scaling-stroke');

  return path;
};

/**
 * Builds an SVG element representing the keychain in the requested view mode.
 *
 * - design view: result base path + decorations + (optional) inner path overlaid at its
 *   real position. All strokes are black.
 * - exploded view: same content as design, plus (if an inner path exists) the viewBox is
 *   extended downward and a translated copy of the inner path is appended below the base.
 *   Different parts use distinct colors for visual separation.
 */
export const buildSvgView = (
  mode: KeychainViewMode,
  { bounds, decorations, defaultViewBox, innerPath, resultBasePath }: BuildKeychainViewParams,
): SVGSVGElement => {
  const colors = KEYCHAIN_COLORS[mode];
  const viewBox = computeDesignViewBox(bounds, defaultViewBox);

  if (mode === 'exploded' && innerPath) {
    viewBox.height += bounds.height + EXPLODED_GAP_PX;
  }

  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('xmlns', NS.SVG);
  svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  // Layer 1: result base path
  svg.appendChild(createPathElement(resultBasePath.pathData, colors.base));

  // Layer 1 decorations (text + element shapes) — cloned so the canonical list stays intact
  for (const decoration of decorations) {
    const clone = decoration.cloneNode(true) as SVGElement;

    clone.setAttribute('fill', colors.decoration);
    svg.appendChild(clone);
  }

  // Layer 2: inner path at its original position
  if (innerPath) {
    svg.appendChild(createPathElement(innerPath.pathData, colors.innerPosition));

    // Exploded extra: translated copy of the inner path below the base
    if (mode === 'exploded') {
      const group = document.createElementNS(NS.SVG, 'g');
      const dy = bounds.height + EXPLODED_GAP_PX;

      group.setAttribute('transform', `translate(0, ${dy})`);
      group.appendChild(createPathElement(innerPath.pathData, colors.innerAlone));
      svg.appendChild(group);
    }
  }

  return svg;
};
