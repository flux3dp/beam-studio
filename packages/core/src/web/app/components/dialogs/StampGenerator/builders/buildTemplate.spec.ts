import paper from 'paper';

import { STAMP_TEMPLATES } from '../templates';
import type { StampTemplate } from '../types';

import { parseTemplate } from './buildTemplate';

const parse = (id: string, override: Partial<StampTemplate> = {}) => {
  const template = STAMP_TEMPLATES.find((t) => t.id === id)!;
  const project = new paper.Project(document.createElement('canvas'));

  return parseTemplate(project, { ...template, ...override });
};

// A dashed ring (three dash segments as one compound frame) under an explicit cut circle.
const DASHED_WITH_CUT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">
<path d="M5 75A70 70 0 1 1 145 75A70 70 0 1 1 5 75Z" stroke="#722ED1" fill="none"/>
<path fill-rule="evenodd" d="M5 70h3v10h-3ZM142 70h3v10h-3ZM70 5h10v3h-10Z" fill="#E5400A"/>
</svg>`;

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
    const { frames, outline } = parse('oval_company', { svgContent: DASHED_WITH_CUT });

    expect(outline instanceof paper.CompoundPath).toBe(false);
    expect(outline.bounds.width).toBeCloseTo(140, 3);
    // The dashes come in as one compound frame with one child per dash.
    expect(frames.some((f) => f instanceof paper.CompoundPath && f.children.length === 3)).toBe(true);
    expect(frames.every((f) => f.bounds.area <= outline.bounds.area)).toBe(true);
  });

  it('uses an ellipse as the outline of a circle border template', () => {
    const { frames, outline } = parse('office_round_post_01');

    // Only the two date rules are left in the SVG; the ring is the runtime border.
    expect(frames).toHaveLength(2);
    expect(outline.bounds.width).toBeCloseTo(142.72, 3);
    // paper draws ellipses as 4 béziers, 0.03% off a true circle.
    expect(Math.abs(outline.area) / (Math.PI * 71.36 ** 2)).toBeCloseTo(1, 3);
  });

  it('uses an ellipse as the outline of an oval border template', () => {
    const { frames, outline } = parse('world_passport_oval');

    expect(frames).toHaveLength(2);
    expect(outline.bounds.width).toBeCloseTo(142.4, 3);
    expect(outline.bounds.height).toBeCloseTo(94.14, 3);
    expect(Math.abs(outline.area) / (Math.PI * 71.2 * 47.07)).toBeCloseTo(1, 3);
  });
});
