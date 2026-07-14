const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args: any[]) => mockGetWorkarea(...args),
}));

const mockCheckDeviceStatus = jest.fn();

jest.mock(
  '@core/helpers/check-device-status',
  () =>
    (...args: any[]) =>
      mockCheckDeviceStatus(...args),
);

const mockSelect = jest.fn();

jest.mock('@core/helpers/device-master', () => ({ select: (...args: any[]) => mockSelect(...args) }));

jest.mock('@core/helpers/duration-formatter', () => () => 'formatted-duration');

import BaseCurveMeasurer from './base';

import type { MeasureData } from '@core/interfaces/ICurveEngraving';

const device = { model: 'fbb2' } as any;

// A concrete subclass so we can script measurePoint results/failures. measurePoint is abstract
// (base throws "Not implemented"); everything else under test lives in the base class.
class TestMeasurer extends BaseCurveMeasurer {
  measurePoint = jest.fn();
}

const buildData = (): MeasureData => ({
  errors: [[null, null]],
  gap: [10, 10],
  highest: null,
  lowest: null,
  objectHeight: 5,
  points: [
    [
      [0, 0, null],
      [10, 0, null],
    ],
  ],
});

describe('BaseCurveMeasurer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkarea.mockReturnValue({ autoFocusOffset: [0, 0, 0] });
  });

  describe('setupDevice', () => {
    test('returns false when device select fails', async () => {
      mockSelect.mockResolvedValueOnce(false);

      const measurer = new TestMeasurer(device);

      expect(await measurer.setupDevice()).toBe(false);
      expect(mockCheckDeviceStatus).not.toHaveBeenCalled();
    });

    test('returns true only when both select and status pass', async () => {
      mockSelect.mockResolvedValueOnce(true);
      mockCheckDeviceStatus.mockResolvedValueOnce(true);

      const measurer = new TestMeasurer(device);

      expect(await measurer.setupDevice()).toBe(true);
    });
  });

  describe('measurePoints', () => {
    test('records a per-point failure as an error string without throwing', async () => {
      const measurer = new TestMeasurer(device);

      measurer.measurePoint.mockResolvedValueOnce({ height: 3 }).mockRejectedValueOnce(new Error('error#921'));

      const res = await measurer.measurePoints(buildData(), [0, 1]);

      expect(res).not.toBeNull();
      // point 0 measured, point 1 failed
      expect(res!.errors[0][0]).toBeNull();
      expect(res!.errors[0][1]).toBe('error#921');
      expect(res!.points[0][1][2]).toBeNull();
    });

    test('aborts and returns null when checkCancel is true', async () => {
      const measurer = new TestMeasurer(device);

      const res = await measurer.measurePoints(buildData(), [0, 1], {
        checkCancel: () => true,
      });

      expect(res).toBeNull();
      expect(measurer.measurePoint).not.toHaveBeenCalled();
    });
  });

  describe('measureArea', () => {
    test('pops up an error and returns null when measurement throws', async () => {
      const measurer = new TestMeasurer(device);

      // Empty xRange => measurePoints reads newPoints[0].length on an empty array of columns,
      // but here we force the throw via measurePoint rejecting AND getWorkarea throwing so the
      // outer try/catch in measureArea is exercised deterministically.
      mockGetWorkarea.mockImplementation(() => {
        throw new Error('boom');
      });

      const res = await measurer.measureArea([0, 10], [0], 5);

      expect(res).toBeNull();
      expect(mockPopUpError).toHaveBeenCalledTimes(1);
      expect(mockPopUpError).toHaveBeenCalledWith({
        message: expect.stringContaining('Failed to measure area'),
      });
    });

    test('returns measured data on the happy path', async () => {
      const measurer = new TestMeasurer(device);

      measurer.measurePoint.mockResolvedValue({ height: 4 });

      const res = await measurer.measureArea([0, 10], [0], 5);

      expect(res).not.toBeNull();
      expect(mockPopUpError).not.toHaveBeenCalled();
      expect(measurer.measurePoint).toHaveBeenCalledTimes(2);
    });
  });
});
