const mockSetDeviceCorrection = jest.fn();
const mockSetScanaheadParams = jest.fn();
const mockStartTask = jest.fn();
const mockGetDeviceClient = jest.fn().mockResolvedValue({
  setDeviceCorrection: mockSetDeviceCorrection,
  setScanaheadParams: mockSetScanaheadParams,
  startTask: mockStartTask,
});

jest.mock('./swiftray-client', () => ({
  getDeviceClient: (...args: unknown[]) => mockGetDeviceClient(...args),
}));

import SwiftrayControl from './swiftray-control';

describe('SwiftrayControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetDeviceCorrection.mockResolvedValue(true);
  });

  test('passes the selected laser source with lens correction parameters', async () => {
    const control = new SwiftrayControl('COM1');

    await control.connect();
    await expect(
      control.setLensCorrection(
        { bulge: 1, scale: 2, skew: 3, trapezoid: 4 },
        { bulge: 5, scale: 6, skew: 7, trapezoid: 8 },
        'UV',
      ),
    ).resolves.toBe(true);

    expect(mockSetDeviceCorrection).toHaveBeenCalledWith({
      bucketX: 1,
      bucketY: 5,
      laserSource: 'UV',
      paralleX: 3,
      paralleY: 7,
      scaleX: 2,
      scaleY: 6,
      trapeX: 4,
      trapeY: 8,
    });
  });

  describe('the lens of a job in its start', () => {
    const lens = {
      field: { angle: 0.5, offsetX: 2, offsetY: -3 },
      galvoParameters: {
        x: { bulge: 1, scale: 2, skew: 3, trapezoid: 4 },
        y: { bulge: 5, scale: 6, skew: 7, trapezoid: 8 },
      },
      laserSource: 'UV' as const,
      worksize: 200,
    };
    const lensParams = {
      correction: {
        bucketX: 1,
        bucketY: 5,
        laserSource: 'UV',
        paralleX: 3,
        paralleY: 7,
        scaleX: 2,
        scaleY: 6,
        trapeX: 4,
        trapeY: 8,
      },
      scanahead: { angle: 0.5, worksize: 200, xOffset: 2, yOffset: -3 },
    };

    test('start sends it in the shapes of the two lens requests', async () => {
      const control = new SwiftrayControl('COM1');

      await control.connect();
      mockStartTask.mockResolvedValue({ success: true });
      await expect(control.start(12, lens)).resolves.toEqual({ success: true });
      expect(mockStartTask).toHaveBeenCalledWith(12, lensParams);
    });

    test('restart sends it too', async () => {
      const control = new SwiftrayControl('COM1');

      await control.connect();
      await control.restart(lens);
      expect(mockStartTask).toHaveBeenCalledWith(undefined, lensParams);
    });

    test('without a lens the start is what it was', async () => {
      const control = new SwiftrayControl('COM1');

      await control.connect();
      await control.start(12);
      await control.restart();
      expect(mockStartTask.mock.calls).toEqual([
        [12, undefined],
        [undefined, undefined],
      ]);
    });

    test('setField sends the same field params on its own', async () => {
      const control = new SwiftrayControl('COM1');

      await control.connect();
      await control.setField(200, lens.field);
      expect(mockSetScanaheadParams).toHaveBeenCalledWith(lensParams.scanahead);
    });
  });
});
