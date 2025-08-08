import type { AddOnInfo } from '@core/app/constants/addOn';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';

import getRotaryRatio from './get-rotary-ratio';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
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

let mockState: Record<string, any>;

describe('test getRotaryRatio', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockState = {
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER,
      'rotary-mirror': false,
      'rotary-scale': 1,
      'rotary-type': RotaryType.Roller,
    };
    mockGetState.mockReturnValue(mockState);
  });

  test('non chuck rotary', () => {
    mockState = { ...mockState, 'rotary-type': RotaryType.Roller };
    expect(getRotaryRatio(mockAddOnInfo)).toBe(1);
  });

  test('non chuck rotary with mirror', () => {
    mockGetState.mockReturnValue({ ...mockState, 'rotary-mirror': true, 'rotary-type': RotaryType.Roller });
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
    mockGetState.mockReturnValue({
      ...mockState,
      'rotary-scale': 2,
    });
    expect(getRotaryRatio(mockAddOnInfo)).toBe(2);
  });

  test('chuck rotary', () => {
    mockGetState.mockReturnValue({
      ...mockState,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-type': RotaryType.Chuck,
    });
    expect(getRotaryRatio(mockAddOnInfo)).toBeCloseTo(0.5);
  });

  test('chuck rotary with mirror', () => {
    mockGetState.mockReturnValue({
      ...mockState,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-mirror': true,
      'rotary-type': RotaryType.Chuck,
    });
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
    mockGetState.mockReturnValue({
      ...mockState,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-mirror': true,
      'rotary-type': RotaryType.Chuck,
    });
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
    mockGetState.mockReturnValue({
      ...mockState,
      'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER * 2,
      'rotary-mirror': true,
      'rotary-scale': 2,
      'rotary-type': RotaryType.Chuck,
    });
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
