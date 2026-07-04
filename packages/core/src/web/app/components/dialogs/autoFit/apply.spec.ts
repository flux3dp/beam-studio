const mockSetSvgElemSize = jest.fn();
const mockMoveElements = jest.fn();
const mockCloneElements = jest.fn();
const mockGetSelectedElements = jest.fn();
const mockMultiSelect = jest.fn();
const mockGetRotationAngle = jest.fn();
const mockSetRotationAngle = jest.fn();
const mockGetBBox = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockBatchCommandCtor = jest.fn();
const mockAddSubCommand = jest.fn();

let mockBatchIsEmpty = false;

class MockBatchCommand {
  addSubCommand = mockAddSubCommand;

  isEmpty = () => mockBatchIsEmpty;

  constructor(...args: any[]) {
    mockBatchCommandCtor(...args);
  }
}

jest.mock('@core/app/svgedit/history/history', () => ({
  __esModule: true,
  BatchCommand: MockBatchCommand,
  default: { BatchCommand: MockBatchCommand },
}));

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  __esModule: true,
  default: { addCommandToHistory: (...args: any[]) => mockAddCommandToHistory(...args) },
}));

jest.mock('@core/app/svgedit/operations/clipboard', () => ({
  cloneElements: (...args: any[]) => mockCloneElements(...args),
}));

jest.mock('@core/app/svgedit/operations/move', () => ({
  moveElements: (...args: any[]) => mockMoveElements(...args),
}));

jest.mock('@core/app/svgedit/selection', () => ({
  __esModule: true,
  default: {
    getSelectedElements: (...args: any[]) => mockGetSelectedElements(...args),
    multiSelect: (...args: any[]) => mockMultiSelect(...args),
  },
}));

jest.mock('@core/app/svgedit/transform/rotation', () => ({
  getRotationAngle: (...args: any[]) => mockGetRotationAngle(...args),
  setRotationAngle: (...args: any[]) => mockSetRotationAngle(...args),
}));

jest.mock('@core/app/svgedit/utils/getBBox', () => ({
  getBBox: (...args: any[]) => mockGetBBox(...args),
}));

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: any) => cb({ Canvas: { setSvgElemSize: (...args: any[]) => mockSetSvgElemSize(...args) } }),
}));

import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import type { ImageDimension } from './AlignModal/dimension';

import apply from './apply';

const makeContour = (center: number[], angle = 0): AutoFitContour => ({
  angle,
  bbox: [0, 0, 10, 10],
  center,
  contour: [[0, 0]],
});

describe('apply', () => {
  const element = { id: 'main-elem' } as unknown as SVGElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBatchIsEmpty = false;
    // setSvgElemSize returns a non-empty command so batch adds it
    mockSetSvgElemSize.mockReturnValue({ isEmpty: () => false });
    mockGetSelectedElements.mockReturnValue([element]);
    mockGetRotationAngle.mockReturnValue(0);
    // element bbox: centered at (50, 50)
    mockGetBBox.mockReturnValue({ height: 20, width: 20, x: 40, y: 40 });
    mockCloneElements.mockResolvedValue(null);
  });

  test('scales, rotates and moves the main element to the main contour', async () => {
    const contours = [makeContour([100, 200])];
    const initDimension: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };
    const imageDimension: ImageDimension = { height: 40, rotation: 30, width: 60, x: 0, y: 0 };

    await apply(element, contours, 0, initDimension, imageDimension);

    expect(mockBatchCommandCtor).toHaveBeenCalledWith('AutoFit');
    expect(mockSetSvgElemSize).toHaveBeenCalledWith('width', 60);
    expect(mockSetSvgElemSize).toHaveBeenCalledWith('height', 40);
    expect(mockSetRotationAngle).toHaveBeenCalledWith(
      element,
      30,
      expect.objectContaining({ parentCmd: expect.anything() }),
    );

    // element center is (50,50); main contour center (100,200); plus dimension-center offset
    const [dx, dy, elems, isRelative] = mockMoveElements.mock.calls[0];

    expect(elems).toEqual([element]);
    expect(isRelative).toBe(false);

    // hand-derived (cos30°=0.8660254, sin30°=0.5):
    // rotated image center  = (30*0.8660254 - 20*0.5, 30*0.5 + 20*0.8660254) = (15.9807621, 32.3205081)
    // initial (0°) center   = (10, 10) => offset = (5.9807621, 22.3205081)
    // target = contour center (100, 200) + offset - element center (50, 50)
    expect(dx[0]).toBeCloseTo(55.9807621, 6);
    expect(dy[0]).toBeCloseTo(172.3205081, 6);
  });

  test('does not clone when there is only the main contour', async () => {
    const contours = [makeContour([100, 200])];
    const dim: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };

    await apply(element, contours, 0, dim, dim);

    expect(mockCloneElements).not.toHaveBeenCalled();
    expect(mockMultiSelect).toHaveBeenCalledWith([element]);
    expect(mockAddCommandToHistory).toHaveBeenCalled();
  });

  test('clones the selected element to each non-main contour with correct offset', async () => {
    // main contour at origin, second contour translated with no angle change
    const mainContour = makeContour([0, 0], 0);
    const secondContour = makeContour([30, 40], 0);
    const contours = [mainContour, secondContour];
    const dim: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };

    // element center (50,50) => elemDx=50, elemDy=50 relative to main contour (0,0)
    mockCloneElements.mockResolvedValue({ elems: [{ id: 'clone' }] });

    await apply(element, contours, 0, dim, dim);

    expect(mockCloneElements).toHaveBeenCalledTimes(1);

    const [elemsArg, dxArg, dyArg, options] = mockCloneElements.mock.calls[0];

    expect(elemsArg).toEqual([element]);
    // dAngle=0 => dx = contourDx + 0, dy = contourDy + 0
    expect(dxArg[0]).toBeCloseTo(30, 6);
    expect(dyArg[0]).toBeCloseTo(40, 6);
    expect(options).toEqual(
      expect.objectContaining({ callChangOnMove: false, parentCmd: expect.anything(), selectElement: false }),
    );

    // both the original and the clone end up selected
    expect(mockMultiSelect).toHaveBeenCalledWith([element, { id: 'clone' }]);
  });

  test('applies rotation delta from contour angle difference to cloned element', async () => {
    const mainContour = makeContour([0, 0], 0);
    // second contour translated by (30, 40) and rotated by 90 degrees (pi/2 rad)
    const secondContour = makeContour([30, 40], Math.PI / 2);
    const contours = [mainContour, secondContour];
    const dim: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };
    const newElem = { id: 'clone' };

    mockGetRotationAngle.mockReturnValue(0);
    mockCloneElements.mockResolvedValue({ elems: [newElem] });

    await apply(element, contours, 0, dim, dim);

    // element offset from main contour center is (50, 50); rotating that offset by
    // +90 deg around the contour center gives (-50, 50), so the clone must move by
    // dx = 30 + (-50 - 50) = -70, dy = 40 + (50 - 50) = 40 (hand-derived)
    const [, dxArg, dyArg] = mockCloneElements.mock.calls[0];

    expect(dxArg[0]).toBeCloseTo(-70, 6);
    expect(dyArg[0]).toBeCloseTo(40, 6);

    // new rotation = 0 + 90 deg, normalized to (-180, 180]
    const rotationCall = mockSetRotationAngle.mock.calls.find((c) => c[0] === newElem);

    expect(rotationCall).toBeDefined();
    expect(rotationCall![1]).toBeCloseTo(90, 6);
  });

  test('uses the contour at mainIdx as placement target and clones to all others', async () => {
    // main contour is NOT the first entry: element goes to (100, 100),
    // clones go to the contours at index 0 and 2
    const contours = [makeContour([20, 30]), makeContour([100, 100]), makeContour([160, 70])];
    const dim: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };

    mockCloneElements.mockResolvedValue({ elems: [{ id: 'clone' }] });

    await apply(element, contours, 1, dim, dim);

    // element center (50, 50) moved onto contours[1] center (100, 100), offset 0 (same dims)
    const [dx, dy] = mockMoveElements.mock.calls[0];

    expect(dx[0]).toBeCloseTo(50, 6);
    expect(dy[0]).toBeCloseTo(50, 6);

    // clones: element offset from main contour = (-50, -50), dAngle = 0
    // contour 0: d = (20 - 100, 30 - 100) = (-80, -70); contour 2: d = (60, -30)
    expect(mockCloneElements).toHaveBeenCalledTimes(2);

    const [, dx0, dy0] = mockCloneElements.mock.calls[0];
    const [, dx2, dy2] = mockCloneElements.mock.calls[1];

    expect(dx0[0]).toBeCloseTo(-80, 6);
    expect(dy0[0]).toBeCloseTo(-70, 6);
    expect(dx2[0]).toBeCloseTo(60, 6);
    expect(dy2[0]).toBeCloseTo(-30, 6);
  });

  test('normalizes rotation angle above 180 into negative range', async () => {
    const mainContour = makeContour([0, 0], 0);
    // dAngle 270 deg -> newAngle 270 %360 =270 >180 -> 270-360 = -90
    const secondContour = makeContour([0, 0], (270 * Math.PI) / 180);
    const contours = [mainContour, secondContour];
    const dim: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };
    const newElem = { id: 'clone' };

    mockGetRotationAngle.mockReturnValue(0);
    mockCloneElements.mockResolvedValue({ elems: [newElem] });

    await apply(element, contours, 0, dim, dim);

    const rotationCall = mockSetRotationAngle.mock.calls.find((c) => c[0] === newElem);

    expect(rotationCall![1]).toBeCloseTo(-90, 6);
  });

  test('does not add command to history when batch is empty', async () => {
    const contours = [makeContour([0, 0])];
    const dim: ImageDimension = { height: 20, rotation: 0, width: 20, x: 0, y: 0 };

    mockSetSvgElemSize.mockReturnValue({ isEmpty: () => true });
    mockBatchIsEmpty = true;

    await apply(element, contours, 0, dim, dim);

    expect(mockAddSubCommand).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });
});
