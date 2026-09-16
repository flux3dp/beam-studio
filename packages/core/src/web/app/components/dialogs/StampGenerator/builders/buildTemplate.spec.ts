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

  it('imports the even-odd square ring as a single filled compound frame', () => {
    const { baselines, frames, outline } = parse('name_seal');
    const roundedRectArea = (side: number, r: number) => side * side - (4 - Math.PI) * r * r;

    expect(frames).toHaveLength(1);
    expect(baselines).toHaveLength(0);
    expect(outline instanceof paper.CompoundPath).toBe(true);
    expect(outline.fillColor).not.toBeNull();
    expect(outline.bounds.width).toBeCloseTo(100, 3);
    expect(outline.bounds.center.x).toBeCloseTo(75, 3);
    expect(outline.bounds.center.y).toBeCloseTo(75, 3);
    // reoriented for nonzero: signed area = outer − inner
    expect(Math.abs(outline.area)).toBeCloseTo(
      roundedRectArea(100, 10) - roundedRectArea(100 - 200 / 30, 10 - 100 / 30),
      0,
    );
  });
});
