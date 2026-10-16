class MockCompoundPath {
  children: any[] = [];
}

jest.mock('paper', () => ({
  __esModule: true,
  default: { CompoundPath: MockCompoundPath },
}));

import { removeDegenerateCurves } from './removeDegenerateCurves';

describe('removeDegenerateCurves', () => {
  // Builds a mock path with `curveLengths.length + 1` segments and one curve per length.
  // Each segment's `remove()` splices itself out of `segments` to mirror Paper.js mutation.
  const createCurvyPath = (curveLengths: number[]) => {
    const segments: any[] = [];

    for (let i = 0; i <= curveLengths.length; i += 1) {
      const seg: any = { handleOut: `h${i}` };

      seg.remove = jest.fn(() => {
        const idx = segments.indexOf(seg);

        if (idx !== -1) segments.splice(idx, 1);
      });
      segments.push(seg);
    }

    const curves = curveLengths.map((length, i) => ({
      length,
      segment1: segments[i],
      segment2: segments[i + 1],
    }));

    return { curves, segments };
  };

  it('should collapse curves shorter than minLength and transfer handleOut to the neighbor', () => {
    const path = createCurvyPath([5, 0.005, 5]);
    const [, seg1, seg2] = path.segments;

    removeDegenerateCurves(path as any);

    // The degenerate curve's segment2 is removed...
    expect(seg2.remove).toHaveBeenCalled();
    // ...and its handleOut is transferred onto segment1 before removal.
    expect(seg1.handleOut).toBe('h2');
    expect(path.segments).toHaveLength(3);
  });

  it('should preserve curves at or above minLength', () => {
    const path = createCurvyPath([5, 5, 5]);

    removeDegenerateCurves(path as any);

    path.segments.forEach((seg) => expect(seg.remove).not.toHaveBeenCalled());
    expect(path.segments).toHaveLength(4);
  });

  it('should keep at least two segments even when curves are degenerate', () => {
    const path = createCurvyPath([0.001]); // 2 segments, 1 curve

    removeDegenerateCurves(path as any);

    path.segments.forEach((seg) => expect(seg.remove).not.toHaveBeenCalled());
    expect(path.segments).toHaveLength(2);
  });

  it('should respect a custom minLength threshold', () => {
    const path = createCurvyPath([5, 2, 5]);
    const [, , seg2] = path.segments;

    removeDegenerateCurves(path as any, 3);

    expect(seg2.remove).toHaveBeenCalled();
  });

  it('should process each child of a CompoundPath', () => {
    const child1 = createCurvyPath([5, 0.005, 5]);
    const child2 = createCurvyPath([5, 0.005, 5]);
    const child1Seg2 = child1.segments[2];
    const child2Seg2 = child2.segments[2];
    const compound = new MockCompoundPath();

    compound.children = [child1, child2];

    removeDegenerateCurves(compound as any);

    expect(child1Seg2.remove).toHaveBeenCalled();
    expect(child2Seg2.remove).toHaveBeenCalled();
  });
});
