import { promarkPnPPoints } from './fisheyeCameraConstants';

describe('Promark camera calibration points', () => {
  test('provides eight reference points for the 200 mm UV work area', () => {
    expect(promarkPnPPoints[200]).toEqual([
      [35, 35],
      [165, 35],
      [35, 165],
      [165, 165],
      [70, 70],
      [130, 70],
      [70, 130],
      [130, 130],
    ]);
  });
});
