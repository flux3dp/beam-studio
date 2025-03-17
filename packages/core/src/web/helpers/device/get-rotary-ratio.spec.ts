import type { AddOnInfo } from '@core/app/constants/add-on';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/add-on';

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

describe('test getRotaryRatio', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('non chuck rotary', () => {
    mockRead.mockReturnValue(RotaryType.Roller).mockReturnValueOnce(false);
    expect(getRotaryRatio(mockAddOnInfo)).toBe(1);
  });

  test('non chuck rotary with mirror', () => {
    mockRead.mockReturnValue(RotaryType.Roller).mockReturnValueOnce(true);
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

  test('chuck rotary', () => {
    mockRead
      .mockReturnValueOnce(RotaryType.Chuck)
      .mockReturnValueOnce(CHUCK_ROTARY_DIAMETER * 2)
      .mockReturnValueOnce(false);
    expect(getRotaryRatio(mockAddOnInfo)).toBeCloseTo(0.5);
  });

  test('chuck rotary with mirror', () => {
    mockRead
      .mockReturnValueOnce(RotaryType.Chuck)
      .mockReturnValueOnce(CHUCK_ROTARY_DIAMETER * 2)
      .mockReturnValueOnce(true);
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
});
