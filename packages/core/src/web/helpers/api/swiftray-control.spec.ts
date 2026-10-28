const mockSetDeviceCorrection = jest.fn();
const mockGetDeviceClient = jest.fn().mockResolvedValue({ setDeviceCorrection: mockSetDeviceCorrection });

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
});
