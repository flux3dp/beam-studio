import paper from 'paper';

import { collectPathItems } from './collectPathItems';

// Moved from KeyChainGenerator/builders/buildShape.spec.ts with the function; runs on real paper.
describe('collectPathItems', () => {
  beforeAll(() => paper.setup(new paper.Size(100, 100)));

  it('returns a Path or CompoundPath itself', () => {
    const path = new paper.Path({ insert: false });
    const compound = new paper.CompoundPath({ insert: false });

    expect(collectPathItems(path)).toEqual([path]);
    expect(collectPathItems(compound)).toEqual([compound]);
  });

  it('flattens groups and layers, nested or not, in order', () => {
    const [a, b, c] = [1, 2, 3].map(() => new paper.Path({ insert: false }));
    const inner = new paper.Group([b, c]);
    const group = new paper.Group([a, inner]);
    const layer = new paper.Layer({ children: [group], insert: false });

    expect(collectPathItems(group)).toEqual([a, b, c]);
    expect(collectPathItems(layer)).toEqual([a, b, c]);
  });

  it('returns nothing for a leaf that is not a path', () => {
    expect(collectPathItems(new paper.PointText({ insert: false, point: [0, 0] }))).toEqual([]);
  });
});
