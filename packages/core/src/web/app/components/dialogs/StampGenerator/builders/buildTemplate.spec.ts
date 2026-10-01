import paper from 'paper';

import { STAMP_TEMPLATES } from '../templates';

import { parseTemplate } from './buildTemplate';

const parse = (id: string) => {
  const template = STAMP_TEMPLATES.find((t) => t.id === id)!;
  const project = new paper.Project(document.createElement('canvas'));

  return parseTemplate(project, template);
};

describe('parseTemplate', () => {
  it('splits oval template into frames + baselines, baselines run left→right', () => {
    const { baselines, frames, outline } = parse('oval_company');

    expect(frames).toHaveLength(3);
    expect(baselines).toHaveLength(2);
    expect(outline.bounds.width).toBeCloseTo(146.57, 1);
    expect(baselines[0].bounds.center.y).toBeLessThan(baselines[1].bounds.center.y);
    baselines.forEach((b) => expect(b.firstSegment.point.x).toBeLessThan(b.lastSegment.point.x));
  });

  it('uses the border box as the outline of a frameless (border) template', () => {
    const { baselines, frames, outline } = parse('name_seal');
    const roundedRectArea = (side: number, r: number) => side * side - (4 - Math.PI) * r * r;

    expect(frames).toHaveLength(0);
    expect(baselines).toHaveLength(0);
    expect(outline.bounds.width).toBeCloseTo(100, 3);
    expect(outline.bounds.center.x).toBeCloseTo(75, 3);
    expect(outline.bounds.center.y).toBeCloseTo(75, 3);
    expect(Math.abs(outline.area)).toBeCloseTo(roundedRectArea(100, 10), 0);
  });

  it('uses an explicit cut path as the outline and keeps the dashes as frames', () => {
    const { frames, outline } = parse('office_round_post_01');

    expect(outline instanceof paper.CompoundPath).toBe(false);
    // The dashes come in as one compound frame with one child per dash.
    expect(frames.some((f) => f instanceof paper.CompoundPath && f.children.length > 10)).toBe(true);
    expect(frames.every((f) => f.bounds.area <= outline.bounds.area)).toBe(true);
  });
});
