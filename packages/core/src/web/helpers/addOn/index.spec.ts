import type { AddOnInfo } from '@core/app/constants/add-on';
import { getAutoFeeder, getPassThrough } from '.';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockGetSupportInfo = jest.fn();

jest.mock('@core/app/constants/add-on', () => ({
  getSupportInfo: (...args) => mockGetSupportInfo(...args),
}));

describe('test getAutoFeeder', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return false if supportInfo not support', () => {
    const supportInfo = { autoFeeder: false } as unknown as AddOnInfo;

    expect(getAutoFeeder(supportInfo)).toBe(false);
    expect(mockRead).not.toHaveBeenCalled();
    expect(mockGetSupportInfo).not.toHaveBeenCalled();
  });

  it('should return false when model supports but preference is false', () => {
    const supportInfo = { autoFeeder: true } as unknown as AddOnInfo;

    mockRead.mockReturnValue(false);
    expect(getAutoFeeder(supportInfo)).toBe(false);
  });

  it('should return false when model supports but borderless is false', () => {
    const supportInfo = { autoFeeder: true, openBottom: true } as unknown as AddOnInfo;

    mockRead.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(getAutoFeeder(supportInfo)).toBe(false);
  });

  it('should return true when model supports and preference is true', () => {
    const supportInfo = { autoFeeder: true } as unknown as AddOnInfo;

    mockRead.mockReturnValue(true);
    expect(getAutoFeeder(supportInfo)).toBe(true);
  });

  it('should return true when model, borderless and preference is true', () => {
    const supportInfo = { autoFeeder: true, openBottom: true } as unknown as AddOnInfo;

    mockRead.mockReturnValue(true);
    expect(getAutoFeeder(supportInfo)).toBe(true);
  });

  it('should call getSupportInfo if not provided', () => {
    const supportInfo = { autoFeeder: true };

    mockGetSupportInfo.mockReturnValue(supportInfo);
    mockRead.mockReturnValueOnce('model').mockReturnValueOnce(true);
    expect(getAutoFeeder()).toBe(true);
    expect(mockGetSupportInfo).toHaveBeenCalledTimes(1);
    expect(mockGetSupportInfo).toHaveBeenLastCalledWith('model');
  });
});

describe('test getPassThrough', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return false if supportInfo not support', () => {
    const supportInfo = { passThrough: false } as unknown as AddOnInfo;

    expect(getPassThrough(supportInfo)).toBe(false);
    expect(mockRead).not.toHaveBeenCalled();
    expect(mockGetSupportInfo).not.toHaveBeenCalled();
  });

  it('should return false when model supports but preference is false', () => {
    const supportInfo = { passThrough: true } as unknown as AddOnInfo;

    mockRead.mockReturnValue(false);
    expect(getPassThrough(supportInfo)).toBe(false);
  });

  it('should return false when model supports but borderless is false', () => {
    const supportInfo = { openBottom: true, passThrough: true } as unknown as AddOnInfo;

    mockRead.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(getPassThrough(supportInfo)).toBe(false);
  });

  it('should return true when model supports and preference is true', () => {
    const supportInfo = { passThrough: true } as unknown as AddOnInfo;

    mockRead.mockReturnValue(true);
    expect(getPassThrough(supportInfo)).toBe(true);
  });

  it('should return true when model, borderless and preference is true', () => {
    const supportInfo = { openBottom: true, passThrough: true } as unknown as AddOnInfo;

    mockRead.mockReturnValue(true);
    expect(getPassThrough(supportInfo)).toBe(true);
  });

  it('should call getSupportInfo if not provided', () => {
    const supportInfo = { passThrough: true };

    mockGetSupportInfo.mockReturnValue(supportInfo);
    mockRead.mockReturnValueOnce('model').mockReturnValueOnce(true);
    expect(getPassThrough()).toBe(true);
    expect(mockGetSupportInfo).toHaveBeenCalledTimes(1);
    expect(mockGetSupportInfo).toHaveBeenLastCalledWith('model');
  });
});
