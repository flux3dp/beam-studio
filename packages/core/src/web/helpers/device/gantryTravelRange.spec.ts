import { clampToGantryTravelRange, getGantryTravelBoundary, getGantryTravelRange } from './gantryTravelRange';

const mockBoundaries: Record<number, { bottom: number; left: number; right: number; top: number }> = {};
let mockModules: number[] = [];
let mockIsGalvoHeadMachine = true;

jest.mock('@core/app/constants/layer-module/module-boundary', () => ({
  getModuleBoundary: (_model: string, module: number) =>
    mockBoundaries[module] ?? { bottom: 0, left: 0, right: 0, top: 0 },
}));

jest.mock('@core/app/constants/workarea-constants', () => ({
  getSupportedModules: () => mockModules,
  getWorkarea: () => ({
    height: 520,
    // what makes it a machine that parks a galvo head, per isGalvoHeadMachine
    supportedModules: mockIsGalvoHeadMachine ? mockModules : [],
    width: 920,
  }),
}));

jest.mock('@core/app/constants/layer-module/layer-modules', () => ({ galvoModules: new Set([1, 2]) }));

describe('gantryTravelRange', () => {
  beforeEach(() => {
    mockIsGalvoHeadMachine = true;
    mockModules = [1, 2];
    // a CO2 galvo parked on the right, a Mopa parked further in
    mockBoundaries[1] = { bottom: 0, left: 0, right: 320, top: 0 };
    mockBoundaries[2] = { bottom: 10, left: 5, right: 440, top: 0 };
  });

  it('unions the parked heads edge by edge, never summing them', () => {
    expect(getGantryTravelBoundary('fhx2galvo')).toEqual({ bottom: 10, left: 5, right: 440, top: 0 });
  });

  it('turns the union into the range the gantry may be sent to', () => {
    expect(getGantryTravelRange('fhx2galvo')).toEqual({ maxX: 480, maxY: 510, minX: 5, minY: 0 });
  });

  it('leaves a machine that parks no head with the whole bed', () => {
    mockIsGalvoHeadMachine = false;

    expect(getGantryTravelRange('fbb2')).toEqual({ maxX: 920, maxY: 520, minX: 0, minY: 0 });
  });

  it('clamps and says so, and says nothing when the point was already reachable', () => {
    expect(clampToGantryTravelRange('fhx2galvo', 600, 300)).toEqual({ clamped: true, x: 480, y: 300 });
    expect(clampToGantryTravelRange('fhx2galvo', 0, 300)).toEqual({ clamped: true, x: 5, y: 300 });
    expect(clampToGantryTravelRange('fhx2galvo', 200, 300)).toEqual({ clamped: false, x: 200, y: 300 });
  });
});
