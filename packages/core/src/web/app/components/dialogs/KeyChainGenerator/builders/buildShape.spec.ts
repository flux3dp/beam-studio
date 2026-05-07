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

jest.mock('paper', () => {
  const mod = {
    CompoundPath: MockCompoundPath,
    Group: MockGroup,
    Layer: MockLayer,
    Path: Object.assign(MockPath, { Circle: MockCircle }),
    Project: jest.fn().mockImplementation(() => ({ importSVG: mockImportSVG })),
  };

  return { __esModule: true, default: mod, ...mod };
});

import { applyHoles, collectPathItems, importBasePath } from './buildShape';

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
  beforeEach(() => jest.clearAllMocks());

  it('should return basePath when no holes are enabled', () => {
    const basePath = new MockPath() as any;
    const state = { holes: { h1: { enabled: false } } } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' as const }] as any[];

    const result = applyHoles(basePath, state, holeDefs);

    expect(result).toBe(basePath);
  });

  it('should return basePath when holeDefs is empty', () => {
    const basePath = new MockPath() as any;
    const state = { holes: {} } as unknown as KeyChainState;

    const result = applyHoles(basePath, state, []);

    expect(result).toBe(basePath);
  });

  it('should create outer and inner circles for ring holes and perform boolean ops', () => {
    const offsetPath = {
      bounds: { topCenter: { x: 50, y: 0 } },
      getNearestPoint: jest.fn().mockReturnValue({ x: 50, y: 0 }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ x: 50, y: -5 }),
      length: 100,
      remove: jest.fn(),
    };

    mockOffset.mockReturnValue(offsetPath);
    Object.setPrototypeOf(offsetPath, MockPath.prototype);

    const unitedResult = new MockPath();
    const subtractedResult = new MockPath();

    // unite is called on basePath (with outer circle), returns unitedResult
    // subtract is called on unitedResult (with inner circle), returns subtractedResult
    mockUnite.mockReturnValueOnce(unitedResult);
    unitedResult.subtract = mockSubtract;
    mockSubtract.mockReturnValueOnce(subtractedResult);

    const basePath = new MockPath() as any;
    const state = {
      holes: {
        h1: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'ring' },
      },
    } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

    const result = applyHoles(basePath, state, holeDefs);

    expect(mockUnite).toHaveBeenCalled();
    expect(mockSubtract).toHaveBeenCalled();
    expect(result).toBe(subtractedResult);
  });

  it('should skip outer circle for punch holes', () => {
    const offsetPath = {
      bounds: { topCenter: { x: 50, y: 0 } },
      getNearestPoint: jest.fn().mockReturnValue({ x: 50, y: 0 }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ x: 50, y: -5 }),
      length: 100,
      remove: jest.fn(),
    };

    mockOffset.mockReturnValue(offsetPath);
    Object.setPrototypeOf(offsetPath, MockPath.prototype);

    const subtractedResult = new MockPath();

    mockSubtract.mockReturnValueOnce(subtractedResult);

    const basePath = new MockPath() as any;
    const state = {
      holes: {
        h1: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'punch' },
      },
    } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

    const result = applyHoles(basePath, state, holeDefs);

    // Punch holes only subtract, no unite for outer ring
    expect(mockUnite).not.toHaveBeenCalled();
    expect(mockSubtract).toHaveBeenCalled();
    expect(result).toBe(subtractedResult);
  });

  it('should apply PUNCH_HOLE_OFFSET for punch type holes', () => {
    const offsetPath = {
      bounds: { topCenter: { x: 50, y: 0 } },
      getNearestPoint: jest.fn().mockReturnValue({ x: 50, y: 0 }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ x: 50, y: -5 }),
      length: 100,
      remove: jest.fn(),
    };

    mockOffset.mockReturnValue(offsetPath);
    Object.setPrototypeOf(offsetPath, MockPath.prototype);
    mockSubtract.mockReturnValueOnce(new MockPath());

    const basePath = new MockPath() as any;
    const state = {
      holes: {
        h1: { diameter: 3, enabled: true, offset: 2, position: 0, thickness: 2, type: 'punch' },
      },
    } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

    applyHoles(basePath, state, holeDefs);

    // PUNCH_HOLE_OFFSET = -5, offset = 2, sizeRatio = 1, PX_TO_MM_RATIO = 10
    // holeOffsetDist = (2 + (-5)) * (10 / 1) = -30
    expect(mockOffset).toHaveBeenCalledWith(basePath, -30, expect.objectContaining({ insert: false }));
  });

  it('should use sizeRatio to scale hole dimensions', () => {
    const offsetPath = {
      bounds: { topCenter: { x: 50, y: 0 } },
      getNearestPoint: jest.fn().mockReturnValue({ x: 50, y: 0 }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ x: 50, y: -5 }),
      length: 100,
      remove: jest.fn(),
    };

    mockOffset.mockReturnValue(offsetPath);
    Object.setPrototypeOf(offsetPath, MockPath.prototype);
    mockSubtract.mockReturnValue(new MockPath());

    const basePath = new MockPath() as any;
    const state = {
      holes: {
        h1: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'ring' },
      },
    } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

    const unitedResult = new MockPath();

    unitedResult.subtract = mockSubtract;
    mockUnite.mockReturnValueOnce(unitedResult);
    mockSubtract.mockReturnValueOnce(new MockPath());

    applyHoles(basePath, state, holeDefs, 2);

    // mmToPx = PX_TO_MM_RATIO / sizeRatio = 10 / 2 = 5
    // holeOffsetDist = (0 + 0) * 5 = 0 (ring, no PUNCH_HOLE_OFFSET)
    expect(mockOffset).toHaveBeenCalledWith(basePath, 0, expect.objectContaining({ insert: false }));
  });

  it('should skip hole when center is undefined', () => {
    const offsetPath = {
      bounds: { topCenter: { x: 50, y: 0 } },
      getNearestPoint: jest.fn().mockReturnValue({ x: 50, y: 0 }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue(undefined),
      length: 100,
      remove: jest.fn(),
    };

    mockOffset.mockReturnValue(offsetPath);
    Object.setPrototypeOf(offsetPath, MockPath.prototype);

    const basePath = new MockPath() as any;
    const state = {
      holes: {
        h1: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'ring' },
      },
    } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

    const result = applyHoles(basePath, state, holeDefs);

    expect(mockUnite).not.toHaveBeenCalled();
    expect(mockSubtract).not.toHaveBeenCalled();
    expect(result).toBe(basePath);
  });

  it('should use normal-based fallback when offsetPath is CompoundPath', () => {
    const offsetPath = new MockCompoundPath();

    (offsetPath as any).remove = jest.fn();
    mockOffset.mockReturnValue(offsetPath);

    const mockMainPath = {
      getNearestPoint: jest.fn().mockReturnValue({ x: 50, y: 0 }),
      getNormalAt: jest.fn().mockReturnValue({ multiply: jest.fn().mockReturnValue({ x: 0, y: -5 }) }),
      getOffsetOf: jest.fn().mockReturnValue(0),
      getPointAt: jest.fn().mockReturnValue({ add: jest.fn().mockReturnValue({ x: 50, y: -5 }) }),
      length: 100,
    };

    const basePath = new MockPath() as any;

    basePath.bounds = { topCenter: { x: 50, y: 0 } };
    (basePath as any).children = undefined;
    // For non-CompoundPath basePath, mainPath = basePath
    Object.assign(basePath, mockMainPath);
    mockSubtract.mockReturnValueOnce(new MockPath());

    const state = {
      holes: {
        h1: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 2, type: 'punch' },
      },
    } as unknown as KeyChainState;
    const holeDefs = [{ id: 'h1', startPositionRef: 'topCenter' }] as any[];

    applyHoles(basePath, state, holeDefs);

    expect(mockMainPath.getNormalAt).toHaveBeenCalled();
    expect(mockMainPath.getPointAt).toHaveBeenCalled();
  });
});
