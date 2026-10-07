import paper from 'paper';

import { STAMP_TEMPLATES } from '../templates';
import type { StampState } from '../types';

import PLUM_ICON from '../templates/icons/plum.svg?raw';

import { buildElementPaths } from './buildElement';

describe('buildElementPaths', () => {
  it('fits the plum into its slot uniformly (aspect preserved, centered) and honors scale', async () => {
    const project = new paper.Project(document.createElement('canvas'));
    const template = STAMP_TEMPLATES.find((t) => t.id === 'tw_company_oval')!;
    const slot = template.elements[0];
    const state = {
      elements: { [slot.id]: { enabled: true, rotation: 0, scale: 100, shapeKey: 'stamp/plum' } },
    } as unknown as StampState;
    const paths = Object.values(await buildElementPaths(project, template, state));
    const group = new paper.Group(paths);
    const { bounds } = group;
    const box = slot.bounds;

    // Inside the slot box, touching it on the longer side, centered on the shorter one.
    expect(Math.max(bounds.width, bounds.height)).toBeCloseTo(Math.min(box.width, box.height), 2);
    expect(bounds.width).toBeLessThanOrEqual(box.width + 0.001);
    expect(bounds.height).toBeLessThanOrEqual(box.height + 0.001);
    expect(bounds.center.x).toBeCloseTo(box.x + box.width / 2, 2);
    expect(bounds.center.y).toBeCloseTo(box.y + box.height / 2, 2);

    // Aspect ratio equals the raw icon's.
    const raw = project.importSVG(PLUM_ICON, { expandShapes: true, insert: false });
    const rawInk = new paper.Group(raw.getItems({ class: paper.PathItem })).bounds;

    expect(bounds.width / bounds.height).toBeCloseTo(rawInk.width / rawInk.height, 3);

    const scaled = await buildElementPaths(project, template, {
      ...state,
      elements: { [slot.id]: { ...state.elements[slot.id], scale: 50 } },
    } as StampState);

    expect(new paper.Group(Object.values(scaled)).bounds.width).toBeCloseTo(bounds.width / 2, 2);
  });
});
