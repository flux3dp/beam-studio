import type { SupportInfo } from '@core/app/constants/add-on';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/add-on';

import getRotaryRatio from './get-rotary-ratio';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockSupportInfo: SupportInfo = {
  autoFocus: true,
  hybridLaser: true,
  lowerFocus: false,
  openBottom: true,
  passThrough: true,
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
    expect(getRotaryRatio(mockSupportInfo)).toBe(1);
  });

  test('non chuck rotary with mirror', () => {
    mockRead.mockReturnValue(RotaryType.Roller).mockReturnValueOnce(true);
    expect(
      getRotaryRatio({
        ...mockSupportInfo,
        rotary: {
          ...mockSupportInfo.rotary,
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
    expect(getRotaryRatio(mockSupportInfo)).toBeCloseTo(0.5);
  });

  test('chuck rotary with mirror', () => {
    mockRead
      .mockReturnValueOnce(RotaryType.Chuck)
      .mockReturnValueOnce(CHUCK_ROTARY_DIAMETER * 2)
      .mockReturnValueOnce(true);
    expect(
      getRotaryRatio({
        ...mockSupportInfo,
        rotary: {
          ...mockSupportInfo.rotary,
          mirror: true,
        },
      }),
    ).toBeCloseTo(-0.5);
  });
});
