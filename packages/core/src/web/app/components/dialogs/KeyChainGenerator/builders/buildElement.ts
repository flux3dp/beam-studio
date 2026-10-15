import paper from 'paper';

import { collectPathItems } from '@core/helpers/generator/collectPathItems';
import { loadShape } from '@core/helpers/generator/loadShape';

import type { ElementOptionDef, KeyChainState } from '../types';

export { loadShape, NP_SHAPE_PREFIX, svgCache } from '@core/helpers/generator/loadShape';

/**
 * Applies all enabled element options to the SVG by importing each shape
 * through Paper.js, scaling to fit bounds, then exporting as flat SVG paths.
 */
export const applyElements = async (
  project: paper.Project,
  svg: SVGSVGElement,
  state: KeyChainState,
  elementDefs: ElementOptionDef[],
): Promise<void> => {
  for (const elementDef of elementDefs) {
    const elementValues = state.elements[elementDef.id];

    if (!elementValues?.enabled || !elementValues.shapeKey) continue;

    const svgString = await loadShape(elementValues.shapeKey);

    if (!svgString) continue;

    const { bounds } = elementDef;

    // Import the SVG into Paper.js project
    const svgItem = project.importSVG(svgString, { expandShapes: true });
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
