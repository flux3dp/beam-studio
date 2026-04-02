import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import { PUNCH_HOLE_OFFSET, PX_TO_MM_RATIO } from './constants';
import type { HoleOptionDef, KeyChainState } from './types';

/**
 * Recursively collects all Paper.js Path/CompoundPath items from the imported SVG.
 */
const collectPathItems = (item: paper.Item): paper.PathItem[] => {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
    return [item];
  }

  if (item instanceof paper.Group || item instanceof paper.Layer) {
    return item.children.flatMap(collectPathItems);
  }

  return [];
};

/**
 * Imports SVG content into a Paper.js project and unites all sub-paths into a single base path.
 * Returns null if no path items are found.
 */
export const importBasePath = (project: paper.Project, svgContent: string): null | paper.PathItem => {
  const svgItem = project.importSVG(svgContent, { expandShapes: true });
  const pathItems = collectPathItems(svgItem);

  if (pathItems.length === 0) return null;

  let basePath = pathItems[0];

  for (let i = 1; i < pathItems.length; i += 1) {
    const newBase = basePath.unite(pathItems[i]);

    basePath.remove();
    pathItems[i].remove();
    basePath = newBase;
  }
  basePath.strokeScaling = false;
  basePath.strokeWidth = 1;

  return basePath;
};

/**
 * Applies all hole boolean operations to the base path in batch:
 * 1. Compute all hole positions on the original base path
 * 2. Unite all outer circles (hole + thickness) with base
 * 3. Subtract all inner circles (the actual holes)
 */
export const applyHoles = (
  basePath: paper.PathItem,
  state: KeyChainState,
  holeDefs: HoleOptionDef[],
): paper.PathItem => {
  const path = (basePath instanceof paper.CompoundPath ? (basePath.children[0] as paper.Path) : basePath) as paper.Path;

  const outerCircles: paper.Path[] = [];
  const innerCircles: paper.Path[] = [];

  for (const holeDef of holeDefs) {
    const hole = state.holes[holeDef.id];

    if (!hole?.enabled) continue;

    const isPunch = hole.type === 'punch';
    const refPoint = path.bounds[holeDef.startPositionRef] as paper.Point;
    const insetPath = PaperOffset.offset(
      path,
      (hole.offset + (isPunch ? PUNCH_HOLE_OFFSET : 0)) * PX_TO_MM_RATIO,
    ) as paper.Path;
    const startPoint = insetPath.getNearestPoint(refPoint);
    const startOffset = insetPath.getOffsetOf(startPoint);

    const normalizedPosition = (hole.position % 100) / 100;
    const pathOffset = (startOffset + normalizedPosition * insetPath.length) % insetPath.length;
    const point = insetPath.getPointAt(pathOffset);

    insetPath.remove();

    if (!point) continue;

    const innerRadius = (hole.diameter / 2) * PX_TO_MM_RATIO;

    innerCircles.push(new paper.Path.Circle(point, innerRadius));

    if (!isPunch && hole.thickness > 0) {
      const outerRadius = (hole.diameter / 2 + hole.thickness) * PX_TO_MM_RATIO;

      outerCircles.push(new paper.Path.Circle(point, outerRadius));
    }
  }

  if (outerCircles.length === 0 && innerCircles.length === 0) return basePath;

  let result: paper.PathItem = basePath;

  for (const circle of outerCircles) {
    const united = result.unite(circle);

    result.remove();
    circle.remove();
    result = united;
  }

  // Subtract all inner circles
  for (const circle of innerCircles) {
    const subtracted = result.subtract(circle);

    result.remove();
    circle.remove();
    result = subtracted;
  }

  return result;
};
