import paper from 'paper';

import { STAMP_TEMPLATES } from '../templates';

import { parseTemplate } from './buildTemplate';

describe('every template', () => {
  it.each(STAMP_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s parses with frames and one baseline per arc slot',
    (_, template) => {
      const project = new paper.Project(document.createElement('canvas'));
      const parsed = parseTemplate(project, template);
      const arcSlots = template.texts.filter((s) => 'baseline' in s).length;

      expect(parsed.frames.length).toBeGreaterThan(0);
      expect(parsed.baselines.length).toBeGreaterThanOrEqual(arcSlots);
      // Baselines read left→right so text-on-path sits upright.
      parsed.baselines.forEach((b) => expect(b.firstSegment.point.x).toBeLessThan(b.lastSegment.point.x));
      // The outline (export scale + cut) is a closed contour around the design center.
      expect(parsed.outline.bounds.center.x).toBeCloseTo(75, 0);
      expect(parsed.outline.bounds.center.y).toBeCloseTo(75, 0);
      // Every slot key resolves to a template slot id exactly once.
      expect(new Set(template.texts.map((s) => s.id)).size).toBe(template.texts.length);
    },
  );
});
