import paper from 'paper';
import { match } from 'ts-pattern';

import { collectPathItems } from '@core/helpers/generator/collectPathItems';

import { ROLE_COLORS } from '../constants';
import type { ParsedTemplate, StampTemplate } from '../types';

import { roundedRect } from './buildBorder';

type PathRole = 'baseline' | 'cut' | 'frame';

/**
 * Classifies an imported SVG path by the designer's color convention (see ROLE_COLORS).
 * Returns null for anything that should be ignored.
 */
const getPathRole = (item: paper.PathItem): null | PathRole => {
  const color = item.fillColor?.toCSS(true) ?? item.strokeColor?.toCSS(true);

  if (!color) return null;

  return match(color)
    .with(ROLE_COLORS.baseline, () => 'baseline' as const)
    .with(ROLE_COLORS.cut, () => 'cut' as const)
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

  const paths = template.svgContent
    ? collectPathItems(project.importSVG(template.svgContent, { expandShapes: true, insert: true }))
    : [];
  const byRole = { baseline: [] as paper.Path[], cut: [] as paper.PathItem[], frame: [] as paper.PathItem[] };

  for (const path of paths) {
    const role = getPathRole(path);

    if (role === 'baseline' && path instanceof paper.Path) byRole.baseline.push(path);
    else if (role === 'frame') byRole.frame.push(path);
    else if (role === 'cut') byRole.cut.push(path);
    else path.remove();
  }

  if (byRole.frame.length === 0 && !template.border) throw new Error(`Template ${template.id} has no frame paths`);

  byRole.frame.forEach((frame) => frame.reorient(false, true));

  // An explicit cut path (e.g. under a dashed edge) wins; otherwise the border box or the largest frame's outer edge is the cut.
  const [cut] = byRole.cut;

  if (cut) {
    cut.remove();
    cut.strokeColor = null;
    cut.fillColor = new paper.Color('black');
    cut.reorient(false, true);
  }

  const outline =
    cut ??
    (template.border
      ? roundedRect(template.border.bounds, template.border.radius)
      : byRole.frame.reduce((a, b) => (b.bounds.area > a.bounds.area ? b : a)));

  const baselines = byRole.baseline
    .sort((a, b) => a.bounds.center.y - b.bounds.center.y)
    .map((p) => {
      if (p.firstSegment.point.x > p.lastSegment.point.x) p.reverse();

      return p;
    });

  return { baselines, frames: byRole.frame, outline };
};
