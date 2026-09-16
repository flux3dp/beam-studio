import paper from 'paper';
import { match } from 'ts-pattern';

import { ROLE_COLORS } from '../constants';
import type { ParsedTemplate, StampTemplate } from '../types';

type PathRole = 'baseline' | 'frame';

const collectPaths = (item: paper.Item): paper.PathItem[] => {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) return [item];

  if (item instanceof paper.Group || item instanceof paper.Layer) return item.children.flatMap(collectPaths);

  return [];
};

/**
 * Classifies an imported SVG path by the designer's color convention (see ROLE_COLORS).
 * Returns null for anything that should be ignored.
 */
const getPathRole = (item: paper.PathItem): null | PathRole => {
  const color = item.fillColor?.toCSS(true) ?? item.strokeColor?.toCSS(true);

  if (!color) return null;

  return match(color)
    .with(ROLE_COLORS.baseline, () => 'baseline' as const)
    .with(ROLE_COLORS.frame, () => 'frame' as const)
    .otherwise(() => null);
};

/**
 * Imports a template SVG into a fresh paper project and splits its paths by role.
 * Baselines are sorted top→bottom and forced to run left→right so text-on-path reads upright.
 * Ring frames authored with `fill-rule="evenodd"` are reoriented so they fill correctly under nonzero too.
 */
export const parseTemplate = (project: paper.Project, template: StampTemplate): ParsedTemplate => {
  project.activate();

  const imported = project.importSVG(template.svgContent, { expandShapes: true, insert: true });
  const paths = collectPaths(imported);
  const byRole = { baseline: [] as paper.Path[], frame: [] as paper.PathItem[] };

  for (const path of paths) {
    const role = getPathRole(path);

    if (role === 'baseline' && path instanceof paper.Path) byRole.baseline.push(path);
    else if (role === 'frame') byRole.frame.push(path);
    else path.remove();
  }

  if (byRole.frame.length === 0) throw new Error(`Template ${template.id} has no frame paths`);

  byRole.frame.forEach((frame) => frame.reorient(false, true));

  const outline = byRole.frame.reduce((a, b) => (b.bounds.area > a.bounds.area ? b : a));

  const baselines = byRole.baseline
    .sort((a, b) => a.bounds.center.y - b.bounds.center.y)
    .map((p) => {
      if (p.firstSegment.point.x > p.lastSegment.point.x) p.reverse();

      return p;
    });

  return { baselines, frames: byRole.frame, outline };
};
