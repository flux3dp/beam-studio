import NS from '@core/app/constants/namespaces';
import { getBBox } from '@core/app/svgedit/utils/getBBox';

import type { BBox } from '../store';

/**
 * Bounding box of a path `d` in canvas units (px), or null when it is empty.
 * The path is never inserted into the document — getBBox measures a detached
 * element by cloning it into #svgroot.
 */
export const getPathBBox = (d: string): BBox | null => {
  const path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;

  path.setAttribute('d', d);

  const bbox = getBBox(path);

  return bbox.width === 0 && bbox.height === 0 ? null : bbox;
};

/**
 * Measure with the layers temporarily shown: getBBox reports zeros inside a
 * `display: none` subtree, and print and cut regularly reads geometry from
 * hidden layers — a finished run hides the whole design, and a cut layer can be
 * hidden by the user. The attribute is restored synchronously, so nothing is
 * painted and the document is never left modified.
 */
export const measureWithLayersShown = <T>(measure: () => T): T => {
  const hidden = [...document.querySelectorAll<SVGGElement>('#svgcontent > g.layer[display="none"]')];

  hidden.forEach((layer) => layer.removeAttribute('display'));

  try {
    return measure();
  } finally {
    hidden.forEach((layer) => layer.setAttribute('display', 'none'));
  }
};
