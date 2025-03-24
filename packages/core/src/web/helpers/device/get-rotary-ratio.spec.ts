import type { AddOnInfo } from '@core/app/constants/addOn';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';

import getRotaryRatio from './get-rotary-ratio';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockAddOnInfo: AddOnInfo = {
  autoFocus: true,
  hybridLaser: true,
  lowerFocus: false,
  openBottom: true,
  passThrough: { maxHeight: 2000 },
  rotary: {
    chuck: true,
    extendWorkarea: false,
    mirror: false,
    roller: true,
  },
};

let mockPreference: Record<string, any>;

describe('test getRotaryRatio', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPreference = {
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER,
      'rotary-mirror': false,
      'rotary-scale': 1,
      'rotary-type': RotaryType.Roller,
    };
    mockRead.mockImplementation((key) => mockPreference[key]);
  });

  test('non chuck rotary', () => {
    mockPreference = { ...mockPreference, 'rotary-type': RotaryType.Roller };
    expect(getRotaryRatio(mockAddOnInfo)).toBe(1);
  });

  test('non chuck rotary with mirror', () => {
    mockPreference = { ...mockPreference, 'rotary-mirror': true, 'rotary-type': RotaryType.Roller };
    expect(
      getRotaryRatio({
        ...mockAddOnInfo,
        rotary: {
          ...mockAddOnInfo.rotary,
          mirror: true,
        },
      }),
    ).toBe(-1);
  });

  test('roller with scale', () => {
    mockPreference = {
      ...mockPreference,
      'rotary-scale': 2,
    };
    expect(getRotaryRatio(mockAddOnInfo)).toBe(2);
  });

  test('chuck rotary', () => {
    mockPreference = {
      ...mockPreference,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-type': RotaryType.Chuck,
    };
    expect(getRotaryRatio(mockAddOnInfo)).toBeCloseTo(0.5);
  });

  test('chuck rotary with mirror', () => {
    mockPreference = {
      ...mockPreference,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-mirror': true,
      'rotary-type': RotaryType.Chuck,
    };
    expect(
      getRotaryRatio({
        ...mockAddOnInfo,
        rotary: {
          ...mockAddOnInfo.rotary,
          mirror: true,
        },
      }),
    ).toBeCloseTo(-0.5);
  });

  test('chuck rotary with non-default diameter', () => {
    mockPreference = {
      ...mockPreference,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-mirror': true,
      'rotary-type': RotaryType.Chuck,
    };
    expect(
      getRotaryRatio({
        ...mockAddOnInfo,
        rotary: {
          ...mockAddOnInfo.rotary,
          chuckDiameter: CHUCK_ROTARY_DIAMETER / 2,
        },
      }),
    ).toBeCloseTo(0.25);
  });

  test('chuck with mirror and scale', () => {
    mockPreference = {
      ...mockPreference,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-mirror': true,
      'rotary-scale': 2,
      'rotary-type': RotaryType.Chuck,
    };
    expect(
      getRotaryRatio({
        ...mockAddOnInfo,
        rotary: {
          ...mockAddOnInfo.rotary,
          mirror: true,
        },
      }),
    ).toBe(-1);
  });
});
