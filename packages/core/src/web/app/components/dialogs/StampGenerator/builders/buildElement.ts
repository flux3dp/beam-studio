import paper from 'paper';

import PLUM_ICON from '../templates/plum-icon.svg?raw';
import type { StampState, StampTemplate } from '../types';

/** Shape key → SVG markup. Only the bundled plum blossom for now; the Element tab picker comes later. */
const SHAPES: Record<string, string> = { plum: PLUM_ICON };

const collectPaths = (item: paper.Item): paper.PathItem[] => {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) return [item];

  return item.children?.flatMap(collectPaths) ?? [];
};

/**
 * One group of paths per enabled element slot: the shape is fitted inside the slot box (uniform
 * scale, centered), then the user's scale % and rotation are applied about the slot center.
 */
export const buildElementPaths = (
  project: paper.Project,
  template: StampTemplate,
  state: StampState,
): paper.PathItem[] =>
  template.elements.flatMap((slot) => {
    const values = state.elements[slot.id];
    const svg = values?.enabled ? SHAPES[values.shapeKey] : undefined;

    if (!svg) return [];

    const { bounds } = slot;
    const imported = project.importSVG(svg, { expandShapes: true, insert: true });
    // Fit the ink, not the SVG viewport: the imported root's bounds are the viewBox.
    const item = new paper.Group(collectPaths(imported));

    imported.remove();
    item.fitBounds(new paper.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height));
    item.scale(values.scale / 100);
    item.rotate(values.rotation);

    const paths = item.removeChildren() as paper.PathItem[];

    item.remove();
    paths.forEach((p) => {
      p.fillColor = new paper.Color('black');
      p.strokeColor = null;
    });

    return paths;
  });
