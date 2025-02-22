import { interpolatePointsFromHeight } from './camera-calibration-helper';

jest.mock('@core/helpers/api/camera-calibration', () => jest.fn().mockImplementation(() => ({})));

jest.mock('@core/helpers/device-master', () => null);

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    calibration: {
      analyze_result_fail: 'analyze_result_fail',
    },
  },
}));
jest.mock('@core/helpers/version-checker', () => null);

describe('camera-calibration-helper', () => {
  test('interpolatePointsFromHeight', () => {
    const points: Array<Array<Array<[number, number]>>> = [[[[1, 1]]], [[[2, 2]]], [[[3, 3]]], [[[4, 4]]]];
    const heights = [1, 2, 3, 4];
    let result = interpolatePointsFromHeight(0.5, heights, points);

    expect(result).toEqual([[[0.5, 0.5]]]);
    result = interpolatePointsFromHeight(5.5, heights, points);
    expect(result).toEqual([[[5.5, 5.5]]]);
    result = interpolatePointsFromHeight(3.7, heights, points);
    expect(result).toEqual([[[3.7, 3.7]]]);
  });
});
