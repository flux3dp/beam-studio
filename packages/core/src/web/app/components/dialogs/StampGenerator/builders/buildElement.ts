import paper from 'paper';

import { collectPathItems } from '@core/helpers/generator/collectPathItems';
import { loadShape, svgCache } from '@core/helpers/generator/loadShape';

import CAMERA from '../templates/icons/camera.svg?raw';
import CHECK from '../templates/icons/check.svg?raw';
import PLANE from '../templates/icons/plane.svg?raw';
import PLUM from '../templates/icons/plum.svg?raw';
import STAR from '../templates/icons/star.svg?raw';
import type { StampState, StampTemplate } from '../types';

import { resolveOverlaps } from './resolveOverlaps';

/**
 * Bundled icons the Element panel has no equivalent for, registered in the shared shape cache under
 * `stamp/*` so loadShape and the preset thumbnails treat them like any other key.
 */
export const BUNDLED_SHAPES: Record<string, string> = {
  'stamp/camera': CAMERA,
  'stamp/check': CHECK,
  'stamp/plane': PLANE,
  'stamp/plum': PLUM,
  'stamp/star': STAR,
};

Object.entries(BUNDLED_SHAPES).forEach(([key, svg]) => svgCache.set(key, svg));

/**
 * One path item per enabled element slot, keyed by slot id: the shape is fitted inside the slot box
 * (uniform scale, centered), then the user's scale % and rotation are applied about the slot center.
 */
export const buildElementPaths = async (
  project: paper.Project,
  template: StampTemplate,
  state: StampState,
): Promise<Record<string, paper.PathItem>> => {
  const items: Record<string, paper.PathItem> = {};

  for (const slot of template.elements) {
    const values = state.elements[slot.id];
    const svg = values?.enabled && values.shapeKey ? await loadShape(values.shapeKey) : null;

    if (!svg) continue;

    const { bounds } = slot;
    const imported = project.importSVG(svg, { expandShapes: true, insert: true });
    // Fit the ink, not the SVG viewport: the imported root's bounds are the viewBox.
    const item = new paper.Group(collectPathItems(imported));

    imported.remove();
    item.fitBounds(new paper.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height));
    item.scale(values.scale / 100);
    item.rotate(values.rotation);

    const compound = new paper.CompoundPath({ children: item.removeChildren(), insert: true });

    item.remove();

    const shape = resolveOverlaps(compound);

    shape.fillColor = new paper.Color('black');
    shape.strokeColor = null;
    items[slot.id] = shape;
  }

  return items;
};
