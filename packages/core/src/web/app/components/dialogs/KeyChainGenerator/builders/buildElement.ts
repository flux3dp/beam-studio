import type { ComponentType } from 'react';
import { createElement } from 'react';

import paper from 'paper';
import ReactDomServer from 'react-dom/server';

import { getNPIconByID } from '@core/helpers/api/flux-id';

import { collectPathItems } from './buildShape';
import type { ElementOptionDef, KeyChainState } from '../types';

/** Prefix used for Noun Project shape keys, e.g. `np/12345`. */
export const NP_SHAPE_PREFIX = 'np/';

/** Cache: shapeKey → rendered SVG markup string */
export const svgCache = new Map<string, string>();

/**
 * Loads a shape SVG by key. Must be called before applyElements for that shape.
 *
 * - Built-in shapes (e.g. `basic/icon-heart1`) are loaded via the Element Panel's
 *   dynamic SVG import.
 * - Noun Project shapes (e.g. `np/12345`) are fetched via `getNPIconByID` which
 *   returns a base64-encoded SVG that we read as text.
 */
export const loadShape = async (shapeKey: string): Promise<null | string> => {
  if (!shapeKey) {
    return null;
  }

  if (svgCache.has(shapeKey)) {
    return svgCache.get(shapeKey)!;
  }

  let svgString: string;

  if (shapeKey.startsWith(NP_SHAPE_PREFIX)) {
    const id = shapeKey.slice(NP_SHAPE_PREFIX.length);
    const base64 = await getNPIconByID(id);

    if (!base64) return null;

    const res = await fetch(base64);

    svgString = await res.text();
  } else {
    const module = await import(`@core/app/icons/shape/${shapeKey}.svg`);
    const Component = module.default as ComponentType;

    svgString = ReactDomServer.renderToStaticMarkup(createElement(Component));
  }

  svgCache.set(shapeKey, svgString);

  return svgString;
};

/**
 * Applies all enabled element options to the SVG by importing each shape
 * through Paper.js, scaling to fit bounds, then exporting as flat SVG paths.
 */
export const applyElements = (
  project: paper.Project,
  svg: SVGSVGElement,
  state: KeyChainState,
  elementDefs: ElementOptionDef[],
): void => {
  for (const elementDef of elementDefs) {
    const elementValues = state.elements[elementDef.id];

    if (!elementValues?.enabled || !elementValues.shapeKey) continue;

    const cachedSvg = svgCache.get(elementValues.shapeKey);

    if (!cachedSvg) continue;

    const { bounds } = elementDef;

    // Import the SVG into Paper.js project
    const svgItem = project.importSVG(cachedSvg, { expandShapes: true });
    const pathItems = collectPathItems(svgItem);

    if (pathItems.length === 0) {
      svgItem.remove();
      continue;
    }

    // Unite all paths into a single path
    let shapePath: paper.PathItem = pathItems[0];

    for (let i = 1; i < pathItems.length; i += 1) {
      const united = shapePath.unite(pathItems[i]);

      shapePath.remove();
      pathItems[i].remove();
      shapePath = united;
    }

    // Scale to fit within bounds while maintaining aspect ratio
    const targetBounds = new paper.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);

    shapePath.fitBounds(targetBounds);

    // Export as SVG path element (Paper.js flattens all transforms)
    const pathEl = shapePath.exportSVG({ asString: false }) as SVGElement;

    pathEl.setAttribute('fill', '#000');
    pathEl.removeAttribute('stroke');
    pathEl.removeAttribute('stroke-width');

    // If it's a compound path, Paper.js exports a <g> — extract inner paths
    if (pathEl.tagName === 'g') {
      const innerPaths = pathEl.querySelectorAll('path');

      for (const inner of innerPaths) {
        inner.setAttribute('fill', '#000');
        inner.removeAttribute('stroke');
        inner.removeAttribute('stroke-width');
        svg.appendChild(inner.cloneNode(true) as SVGElement);
      }
    } else {
      svg.appendChild(pathEl);
    }

    // Clean up Paper.js items
    shapePath.remove();
    svgItem.remove();
  }
};
