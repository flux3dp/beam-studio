const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetPosition = jest.fn();

jest.mock('@core/app/actions/canvas/rotary-axis', () => ({
  getPosition: mockGetPosition,
}));

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/addOn', () => ({
  getAddOnInfo: mockGetAddOnInfo,
}));

const mockGetRotaryRatio = jest.fn();

jest.mock('@core/helpers/device/get-rotary-ratio', () => mockGetRotaryRatio);

import { getRotaryInfo } from './rotary';

describe('test getAutoFeeder', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetPosition.mockReturnValue(10);
    mockGetRotaryRatio.mockReturnValue(1.23);
  });

  it('should return null if addOnInfo not support', () => {
    mockGetAddOnInfo.mockReturnValue({});
    mockGetState.mockReturnValue({});

    expect(getRotaryInfo('ado1')).toBe(null);
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
  });

  it('should return null when model supports but preference is false', () => {
    mockGetAddOnInfo.mockReturnValue({ rotary: { roller: true } });
    mockGetState.mockReturnValue({ rotary_mode: false });

    expect(getRotaryInfo('ado1')).toBe(null);
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
  });

  it('should return basic info when model not supports split', () => {
    mockGetAddOnInfo.mockReturnValue({ rotary: {} });
    mockGetState.mockReturnValue({ rotary_mode: true });

    expect(getRotaryInfo('ado1')).toEqual({
      useAAxis: true,
      y: 10,
      yRatio: 1.23,
    });
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
    expect(mockGetPosition).toHaveBeenCalledTimes(1);
    expect(mockGetPosition).toHaveBeenLastCalledWith(false);
    expect(mockGetRotaryRatio).toHaveBeenCalledTimes(1);
  });

  it('should return split info when model supports', () => {
    mockGetAddOnInfo.mockReturnValue({ rotary: { split: true } });
    mockGetState.mockReturnValue({ 'rotary-overlap': 1, 'rotary-split': 2, rotary_mode: true });

    expect(getRotaryInfo('fpm1')).toEqual({
      useAAxis: false,
      y: 10,
      yOverlap: 1,
      yRatio: 1.23,
      ySplit: 2,
    });
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('fpm1');
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockGetPosition).toHaveBeenCalledTimes(1);
    expect(mockGetPosition).toHaveBeenLastCalledWith(false);
    expect(mockGetRotaryRatio).toHaveBeenCalledTimes(1);
  });

  it('should read workarea if not provided', () => {
    mockGetAddOnInfo.mockReturnValue({ rotary: {} });
    mockGetState.mockReturnValue({ rotary_mode: true, workarea: 'ado1' });

    expect(getRotaryInfo()).toEqual({
      useAAxis: true,
      y: 10,
      yRatio: 1.23,
    });
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
    expect(mockGetPosition).toHaveBeenCalledTimes(1);
    expect(mockGetPosition).toHaveBeenLastCalledWith(false);
    expect(mockGetRotaryRatio).toHaveBeenCalledTimes(1);
  });

  it('should get y in mm when flag is true', () => {
    mockGetAddOnInfo.mockReturnValue({ rotary: {} });
    mockGetState.mockReturnValue({ rotary_mode: true });

    expect(getRotaryInfo('ado1', { axisInMm: true })).toEqual({
      useAAxis: true,
      y: 10,
      yRatio: 1.23,
    });
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
    expect(mockGetPosition).toHaveBeenCalledTimes(1);
    expect(mockGetPosition).toHaveBeenLastCalledWith(true);
    expect(mockGetRotaryRatio).toHaveBeenCalledTimes(1);
  });

  it('should use job origin y if provided', () => {
    mockGetAddOnInfo.mockReturnValue({ rotary: {} });
    mockGetState.mockReturnValue({ rotary_mode: true });

    expect(getRotaryInfo('ado1', { forceY: 15 })).toEqual({
      useAAxis: true,
      y: 15,
      yRatio: 1.23,
    });
  });
});
