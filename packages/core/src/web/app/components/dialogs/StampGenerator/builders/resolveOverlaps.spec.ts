import paper from 'paper';

import { resolveOverlaps } from './resolveOverlaps';

describe('resolveOverlaps', () => {
  beforeAll(() => {
    paper.setup(document.createElement('canvas'));
  });

  it('merges overlapping same-direction contours into their union', () => {
    // Like Montserrat's "4": a body and a bar that overlap.
    const body = new paper.Path.Rectangle(new paper.Point(0, 0), new paper.Size(10, 10));
    const bar = new paper.Path.Rectangle(new paper.Point(8, -5), new paper.Size(4, 20));
    const glyph = new paper.CompoundPath({ children: [body, bar] });

    const clean = resolveOverlaps(glyph) as paper.Path;

    expect(Math.abs(clean.area)).toBeCloseTo(100 + 80 - 20, 3);
  });
});
