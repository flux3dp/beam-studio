import type { KeyChainState } from '../types';

const mockOffset = jest.fn();

jest.mock('paperjs-offset', () => ({
  PaperOffset: { offset: (...args: any[]) => mockOffset(...args) },
}));

const mockUnite = jest.fn();
const mockSubtract = jest.fn();
const mockRemove = jest.fn();
const mockImportSVG = jest.fn();

class MockPath {
  children: any[] = [];
  curves: any[] = [];
  segments: any[] = [];
  strokeScaling = true;
  strokeWidth = 0;
  remove = mockRemove;
  unite = mockUnite;
  subtract = mockSubtract;
}

class MockCompoundPath {
  children: any[] = [];
  remove = mockRemove;
}

class MockGroup {
  children: any[];

  constructor(children: any[] = []) {
    this.children = children;
  }
}

class MockLayer {
  children: any[];

  constructor(children: any[] = []) {
    this.children = children;
  }
}

class MockCircle {
  center: any;
  radius: any;
  remove = jest.fn();

  constructor(center: any, radius: any) {
    this.center = center;
    this.radius = radius;
  }
}

class MockLine {
  remove = jest.fn();

  constructor(
    public from: any,
    public to: any,
  ) {}
}

jest.mock('paper', () => {
  const mod = {
    CompoundPath: MockCompoundPath,
    Group: MockGroup,
    Layer: MockLayer,
    Path: Object.assign(MockPath, { Circle: MockCircle, Line: MockLine }),
    Project: jest.fn().mockImplementation(() => ({ importSVG: mockImportSVG })),
  };

  return { __esModule: true, default: mod, ...mod };
});

import { applyHoles, collectPathItems, importBasePath, removeDegenerateCurves, resolveHoleValues } from './buildShape';

describe('collectPathItems', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return Path item in array', () => {
    const path = new MockPath();
    const result = collectPathItems(path as any);

    expect(result).toEqual([path]);
  });

  it('should return CompoundPath item in array', () => {
    const cp = new MockCompoundPath();
    const result = collectPathItems(cp as any);

    expect(result).toEqual([cp]);
  });

  it('should recursively collect from Group children', () => {
    const path1 = new MockPath();
    const path2 = new MockPath();
    const group = new MockGroup([path1, path2]);
    const result = collectPathItems(group as any);

    expect(result).toEqual([path1, path2]);
  });

  it('should recursively collect from Layer children', () => {
    const path = new MockPath();
    const layer = new MockLayer([path]);
    const result = collectPathItems(layer as any);

    expect(result).toEqual([path]);
  });

  it('should handle nested groups', () => {
    const path1 = new MockPath();
    const path2 = new MockPath();
    const innerGroup = new MockGroup([path2]);
    const outerGroup = new MockGroup([path1, innerGroup]);
    const result = collectPathItems(outerGroup as any);

    expect(result).toEqual([path1, path2]);
  });

  it('should return empty array for unknown item types', () => {
    const result = collectPathItems({} as any);

    expect(result).toEqual([]);
  });
});

describe('importBasePath', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return null when no path items found', () => {
    mockImportSVG.mockReturnValue(new MockGroup([]));

    const project = { importSVG: mockImportSVG } as any;
    const result = importBasePath(project, '<svg></svg>');

    expect(result).toBeNull();
  });

  it('should return single path without uniting', () => {
    const path = new MockPath();

    mockImportSVG.mockReturnValue(new MockGroup([path]));

    const project = { importSVG: mockImportSVG } as any;
    const result = importBasePath(project, '<svg><path/></svg>');

    expect(result).toBe(path);
    expect(mockUnite).not.toHaveBeenCalled();
    expect(result!.strokeScaling).toBe(false);
    expect(result!.strokeWidth).toBe(1);
  });

  it('should unite multiple paths and remove originals', () => {
    const path1 = new MockPath();
    const path2 = new MockPath();
    const unitedPath = new MockPath();

    mockImportSVG.mockReturnValue(new MockGroup([path1, path2]));
    mockUnite.mockReturnValue(unitedPath);

    const project = { importSVG: mockImportSVG } as any;
    const result = importBasePath(project, '<svg></svg>');

    expect(mockUnite).toHaveBeenCalledWith(path2);
    expect(path1.remove).toHaveBeenCalled();
    expect(path2.remove).toHaveBeenCalled();
    expect(result).toBe(unitedPath);
    expect(unitedPath.strokeScaling).toBe(false);
    expect(unitedPath.strokeWidth).toBe(1);
  });

  it('should call importSVG with expandShapes option', () => {
    mockImportSVG.mockReturnValue(new MockGroup([]));

    const project = { importSVG: mockImportSVG } as any;

    importBasePath(project, '<svg/>');
    expect(mockImportSVG).toHaveBeenCalledWith('<svg/>', { expandShapes: true });
  });
});

describe('applyHoles', () => {
  const defaultHoleDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

  const createHoleState = (overrides: Record<string, unknown> = {}) =>
    ({
      holes: {
        h1: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'ring', ...overrides },
      },
    }) as unknown as KeyChainState;

  const setupMockOffsetPath = (overrides: Record<string, unknown> = {}) => {
    const startPoint = { getDistance: jest.fn().mockReturnValue(0), x: 50, y: 0 };
    const offsetPath = {
      bounds: { center: { x: 50, y: 50 }, topCenter: { x: 50, y: 0 } },
      getIntersections: jest.fn().mockReturnValue([{ point: startPoint }]),
      getNearestPoint: jest.fn().mockReturnValue(startPoint),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ x: 50, y: -5 }),
      length: 100,
      remove: jest.fn(),
      ...overrides,
    };

    mockOffset.mockReturnValue(offsetPath);
    Object.setPrototypeOf(offsetPath, MockPath.prototype);

    return offsetPath;
  };

  beforeEach(() => jest.clearAllMocks());

  it('should return basePath when no holes are enabled', () => {
    const basePath = new MockPath() as any;
    const state = { holes: { h1: { enabled: false } } } as unknown as KeyChainState;

    const result = applyHoles(basePath, state, defaultHoleDefs);

    expect(result).toBe(basePath);
  });

  it('should return basePath when holeDefs is empty', () => {
    const basePath = new MockPath() as any;
    const state = { holes: {} } as unknown as KeyChainState;

    const result = applyHoles(basePath, state, []);

    expect(result).toBe(basePath);
  });

  it('should create outer and inner circles for ring holes and perform boolean ops', () => {
    setupMockOffsetPath();

    const unitedResult = new MockPath();
    const subtractedResult = new MockPath();

    mockUnite.mockReturnValueOnce(unitedResult);
    unitedResult.subtract = mockSubtract;
    mockSubtract.mockReturnValueOnce(subtractedResult);

    const basePath = new MockPath() as any;
    const result = applyHoles(basePath, createHoleState(), defaultHoleDefs);

    expect(mockUnite).toHaveBeenCalled();
    expect(mockSubtract).toHaveBeenCalled();
    expect(result).toBe(subtractedResult);
  });

  it('should skip outer circle for punch holes', () => {
    setupMockOffsetPath();

    const subtractedResult = new MockPath();

    mockSubtract.mockReturnValueOnce(subtractedResult);

    const basePath = new MockPath() as any;
    const result = applyHoles(basePath, createHoleState({ type: 'punch' }), defaultHoleDefs);

    expect(mockUnite).not.toHaveBeenCalled();
    expect(mockSubtract).toHaveBeenCalled();
    expect(result).toBe(subtractedResult);
  });

  it('should apply PUNCH_HOLE_OFFSET for punch type holes', () => {
    setupMockOffsetPath();
    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;

    applyHoles(basePath, createHoleState({ offset: 2, type: 'punch' }), defaultHoleDefs);

    // PUNCH_HOLE_OFFSET = -5, offset = 2, sizeRatio = 1, PX_TO_MM_RATIO = 10
    // holeOffsetDist = (2 + (-5)) * (10 / 1) = -30
    expect(mockOffset).toHaveBeenCalledWith(basePath, -30, expect.objectContaining({ insert: false }));
  });

  it('should use sizeRatio to scale hole dimensions', () => {
    setupMockOffsetPath();

    const unitedResult = new MockPath();

    unitedResult.subtract = mockSubtract;
    mockUnite.mockReturnValueOnce(unitedResult);
    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;

    applyHoles(basePath, createHoleState(), defaultHoleDefs, 2);

    // mmToPx = PX_TO_MM_RATIO / sizeRatio = 10 / 2 = 5
    // holeOffsetDist = (0 + 0) * 5 = 0 (ring, no PUNCH_HOLE_OFFSET)
    expect(mockOffset).toHaveBeenCalledWith(basePath, 0, expect.objectContaining({ insert: false }));
  });

  it('should skip hole when center is undefined', () => {
    setupMockOffsetPath({ getPointAt: jest.fn().mockReturnValue(undefined) });

    const basePath = new MockPath() as any;
    const result = applyHoles(basePath, createHoleState(), defaultHoleDefs);

    expect(mockUnite).not.toHaveBeenCalled();
    expect(mockSubtract).not.toHaveBeenCalled();
    expect(result).toBe(basePath);
  });

  it('should use normal-based fallback when offsetPath is CompoundPath', () => {
    const offsetPath = new MockCompoundPath();

    (offsetPath as any).remove = jest.fn();
    mockOffset.mockReturnValue(offsetPath);

    const mainStartPoint = { getDistance: jest.fn().mockReturnValue(0), x: 50, y: 0 };
    const mockMainPath = {
      bounds: { center: { x: 50, y: 50 }, topCenter: { x: 50, y: 0 } },
      getIntersections: jest.fn().mockReturnValue([{ point: mainStartPoint }]),
      getNearestPoint: jest.fn().mockReturnValue(mainStartPoint),
      getNormalAt: jest.fn().mockReturnValue({ multiply: jest.fn().mockReturnValue({ x: 0, y: -5 }) }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ add: jest.fn().mockReturnValue({ x: 50, y: -5 }) }),
      length: 100,
    };

    const basePath = new MockPath() as any;

    basePath.bounds = { center: { x: 50, y: 50 }, topCenter: { x: 50, y: 0 } };
    (basePath as any).children = undefined;
    Object.assign(basePath, mockMainPath);
    mockSubtract.mockReturnValueOnce(new MockPath());

    applyHoles(basePath, createHoleState({ type: 'punch' }), defaultHoleDefs);

    expect(mockMainPath.getNormalAt).toHaveBeenCalled();
    expect(mockMainPath.getPointAt).toHaveBeenCalled();
  });

  it('should apply positionOffset to shift the baseline position', () => {
    const offsetPath = setupMockOffsetPath();

    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;
    const holeDefs = [{ id: 'h1', positionOffset: 25, startPositionRef: 'topCenter' }] as any[];

    applyHoles(basePath, createHoleState({ position: 0, type: 'punch' }), holeDefs);

    // position=0, positionOffset=25 → normalizedPosition = (0/100 + 25/100) % 1 = 0.25
    // startOffset=0, length=100 → pathOffset = (0 + 0.25 * 100) % 100 = 25
    expect(offsetPath.getPointAt).toHaveBeenCalledWith(25);
  });

  it('should wrap positionOffset past 100%', () => {
    const offsetPath = setupMockOffsetPath();

    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;
    const holeDefs = [{ id: 'h1', positionOffset: 75, startPositionRef: 'topCenter' }] as any[];

    applyHoles(basePath, createHoleState({ position: 50, type: 'punch' }), holeDefs);

    // position=50, positionOffset=75 → normalizedPosition = (50/100 + 75/100) % 1 = 1.25 % 1 = 0.25
    // startOffset=0, length=100 → pathOffset = (0 + 0.25 * 100) % 100 = 25
    expect(offsetPath.getPointAt).toHaveBeenCalledWith(25);
  });

  it('should apply baseOffset to shift the hole distance from the path', () => {
    setupMockOffsetPath();
    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;
    const holeDefs = [{ baseOffset: 1, id: 'h1', startPositionRef: 'topCenter' }] as any[];

    applyHoles(basePath, createHoleState({ offset: 2, type: 'punch' }), holeDefs);

    // PUNCH_HOLE_OFFSET = -5, offset = 2, baseOffset = 1, sizeRatio = 1, PX_TO_MM_RATIO = 10
    // holeOffsetDist = (2 + 1 + (-5)) * (10 / 1) = -20
    expect(mockOffset).toHaveBeenCalledWith(basePath, -20, expect.objectContaining({ insert: false }));
  });

  it('should use default values for hidden fields via fieldVisibility', () => {
    setupMockOffsetPath();
    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;
    const holeDefs = [
      {
        defaults: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'ring' },
        fieldVisibility: { position: ['ring'] },
        id: 'h1',
        startPositionRef: 'topCenter',
      },
    ] as any[];

    // User set position=50, but type=punch so position should resolve to default (0)
    applyHoles(basePath, createHoleState({ position: 50, type: 'punch' }), holeDefs);

    // position resolves to default 0, positionOffset undefined → normalizedPosition = 0
    // startOffset=0, length=100 → pathOffset = 0
    expect(mockOffset).toHaveBeenCalled();
  });
});

describe('resolveHoleValues', () => {
  const defaults = { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'ring' as const };

  it('should return original values when no fieldVisibility is defined', () => {
    const hole = { ...defaults, position: 50 };
    const holeDef = { defaults, id: 'h1', startPositionRef: 'topCenter' } as any;

    const result = resolveHoleValues(hole, holeDef);

    expect(result).toBe(hole);
  });

  it('should substitute defaults for fields hidden by current type', () => {
    const hole = { ...defaults, position: 50, type: 'punch' as const };
    const holeDef = {
      defaults,
      fieldVisibility: { position: ['ring'] },
      id: 'h1',
      startPositionRef: 'topCenter',
    } as any;

    const result = resolveHoleValues(hole, holeDef);

    expect(result.position).toBe(0); // default
    expect(result.type).toBe('punch'); // unchanged
  });

  it('should keep field values when current type is in allowed types', () => {
    const hole = { ...defaults, position: 50, type: 'ring' as const };
    const holeDef = {
      defaults,
      fieldVisibility: { position: ['ring'] },
      id: 'h1',
      startPositionRef: 'topCenter',
    } as any;

    const result = resolveHoleValues(hole, holeDef);

    expect(result.position).toBe(50);
  });

  it('should handle multiple fields in fieldVisibility', () => {
    const hole = { ...defaults, offset: 5, position: 50, type: 'punch' as const };
    const holeDef = {
      defaults,
      fieldVisibility: { offset: ['ring'], position: ['ring'] },
      id: 'h1',
      startPositionRef: 'topCenter',
    } as any;

    const result = resolveHoleValues(hole, holeDef);

    expect(result.position).toBe(0); // default
    expect(result.offset).toBe(0); // default
    expect(result.diameter).toBe(3); // unchanged (not in fieldVisibility)
  });
});

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
