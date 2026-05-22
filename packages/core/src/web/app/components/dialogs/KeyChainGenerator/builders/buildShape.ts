import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import { PUNCH_HOLE_OFFSET, PX_TO_MM_RATIO } from '../constants';
import type { HoleOptionDef, HoleOptionValues, KeyChainState } from '../types';

/**
 * Recursively collects all Paper.js Path/CompoundPath items from the imported SVG.
 */
export const collectPathItems = (item: paper.Item): paper.PathItem[] => {
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
 * Finds the starting point on a path for hole positioning.
 * Uses ray intersection (ref point → center) to handle concave shapes
 * where getNearestPoint would snap to an inner concavity.
 */
const getStartPoint = (path: paper.Path, startPositionRef: HoleOptionDef['startPositionRef']): paper.Point => {
  const refPoint = path.bounds[startPositionRef] as paper.Point;
  const ray = new paper.Path.Line(refPoint, path.bounds.center);
  const intersections = path.getIntersections(ray);

  ray.remove();

  if (intersections.length > 0) {
    let closest = intersections[0];
    let minDist = closest.point.getDistance(refPoint);

    for (let i = 1; i < intersections.length; i += 1) {
      const dist = intersections[i].point.getDistance(refPoint);

      if (dist < minDist) {
        minDist = dist;
        closest = intersections[i];
      }
    }

    return closest.point;
  }

  // Fallback: ref point is already on the path (convex case)
  return path.getNearestPoint(refPoint);
};

/**
 * Resolves hole option values by substituting defaults for fields hidden by fieldVisibility.
 */
export const resolveHoleValues = (hole: HoleOptionValues, holeDef: HoleOptionDef): HoleOptionValues => {
  const { fieldVisibility } = holeDef;

  if (!fieldVisibility) return hole;

  const resolved = { ...hole };

  for (const [field, allowedTypes] of Object.entries(fieldVisibility)) {
    if (!allowedTypes.includes(hole.type)) {
      (resolved as any)[field as keyof HoleOptionValues] = holeDef.defaults[field as keyof HoleOptionValues];
    }
  }

  return resolved;
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
  sizeRatio: number = 1,
): paper.PathItem => {
  const outerCircles: paper.Path[] = [];
  const innerCircles: paper.Path[] = [];
  const mmToPx = PX_TO_MM_RATIO / sizeRatio;

  for (const holeDef of holeDefs) {
    const hole = state.holes[holeDef.id];

    if (!hole?.enabled) continue;

    const resolved = resolveHoleValues(hole, holeDef);
    const isPunch = resolved.type === 'punch';
    const mainPath =
      basePath instanceof paper.CompoundPath ? (basePath.children[0] as paper.Path) : (basePath as paper.Path);
    const positionOffset = (holeDef.positionOffset ?? 0) / 100;
    const normalizedPosition = ((((resolved.position % 100) / 100 + positionOffset) % 1) + 1) % 1;

    const holeOffsetDist = (resolved.offset + (holeDef.baseOffset ?? 0) + (isPunch ? PUNCH_HOLE_OFFSET : 0)) * mmToPx;
    const offsetPath = PaperOffset.offset(mainPath, holeOffsetDist, { insert: false, join: 'round' });
    let center: paper.Point;

    if (offsetPath instanceof paper.Path) {
      // Use offset path to find hole center if the path is not separated by offset
      const startPoint = getStartPoint(offsetPath, holeDef.startPositionRef);
      const startOffset = offsetPath.getOffsetOf(startPoint);
      const pathOffset = (startOffset + normalizedPosition * offsetPath.length) % offsetPath.length;

      center = offsetPath.getPointAt(pathOffset);
    } else {
      // Fallback to main path with normal-based offset if offsetPath is a CompoundPath (i.e. path was separated by offset)
      const startPoint = getStartPoint(mainPath, holeDef.startPositionRef);
      const startOffset = mainPath.getOffsetOf(startPoint);
      const pathOffset = (startOffset + normalizedPosition * mainPath.length) % mainPath.length;
      const point = mainPath.getPointAt(pathOffset);
      const normal = mainPath.getNormalAt(pathOffset);

      center = point.add(normal.multiply(holeOffsetDist));
    }

    offsetPath.remove();

    if (!center) continue;

    const innerRadius = (resolved.diameter / 2) * mmToPx;

    innerCircles.push(new paper.Path.Circle(center, innerRadius));

    if (!isPunch && resolved.thickness > 0) {
      const outerRadius = (resolved.diameter / 2 + resolved.thickness) * mmToPx;

      outerCircles.push(new paper.Path.Circle(center, outerRadius));
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
