import type paper from 'paper';

import NS from '@core/app/constants/namespaces';

import { EXPLODED_GAP_PX, KEYCHAIN_COLORS, type KeychainViewMode } from '../constants';

interface BuildKeychainViewParams {
  bounds: paper.Rectangle;
  decorations: { emboss: SVGElement[]; engraving: SVGElement[]; refPaths: SVGPathElement[] };
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
  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('xmlns', NS.SVG);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  // Base Path
  svg.appendChild(createPathElement(resultBasePath.pathData, colors.base));

  // Invisible reference paths for textPath href resolution — must be in DOM before <text> elements
  for (const refPath of decorations.refPaths) {
    svg.appendChild(refPath.cloneNode(true));
  }

  // Engraving Decorations - filled
  for (const decoration of decorations.engraving) {
    const clone = decoration.cloneNode(true) as SVGElement;

    clone.setAttribute('fill', colors.engraving);
    svg.appendChild(clone);
  }

  const appendEmbossElements = (parent: SVGElement, color: string) => {
    if (innerPath) {
      parent.appendChild(createPathElement(innerPath.pathData, color));
    }

    for (const decoration of decorations.emboss) {
      const clone = decoration.cloneNode(true) as SVGElement;

      clone.setAttribute('fill', 'none');
      clone.setAttribute('stroke', color);
      clone.setAttribute('stroke-width', '1');
      clone.setAttribute('vector-effect', 'non-scaling-stroke');
      parent.appendChild(clone);
    }
  };

  // Emboss decorations align — stroke-only, inside base path
  appendEmbossElements(svg, colors.embossAlign);

  // Emboss decorations — stroke-only, standalone below base path
  if (mode === 'exploded' && (innerPath || decorations.emboss.length > 0)) {
    viewBox.height += bounds.height + EXPLODED_GAP_PX;

    // Exploded extra: translated copies of inner path + emboss decorations below the base
    const group = document.createElementNS(NS.SVG, 'g');
    const dy = bounds.height + EXPLODED_GAP_PX;

    group.setAttribute('transform', `translate(0, ${dy})`);

    appendEmbossElements(group, colors.emboss);
    svg.appendChild(group);
  }

  svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);

  return svg;
};
