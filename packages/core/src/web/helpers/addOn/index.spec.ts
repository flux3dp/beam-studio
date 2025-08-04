import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAutoFeeder, getPassThrough } from '.';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/addOn', () => ({
  getAddOnInfo: (...args) => mockGetAddOnInfo(...args),
}));

describe('test getAutoFeeder', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return false if addOnInfo not support', () => {
    const addOnInfo = { autoFeeder: false } as unknown as AddOnInfo;

    expect(getAutoFeeder(addOnInfo)).toBe(false);
    expect(mockGetAddOnInfo).not.toHaveBeenCalled();
  });

  it('should return false when model supports but preference is false', () => {
    const addOnInfo = { autoFeeder: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ 'auto-feeder': false });
    expect(getAutoFeeder(addOnInfo)).toBe(false);
  });

  it('should return false when model supports but borderless is false', () => {
    const addOnInfo = { autoFeeder: true, openBottom: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValueOnce({ 'auto-feeder': true, borderless: false });
    expect(getAutoFeeder(addOnInfo)).toBe(false);
  });

  it('should return true when model supports and preference is true', () => {
    const addOnInfo = { autoFeeder: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ 'auto-feeder': true });
    expect(getAutoFeeder(addOnInfo)).toBe(true);
  });

  it('should return true when model, borderless and preference is true', () => {
    const addOnInfo = { autoFeeder: true, openBottom: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ 'auto-feeder': true, borderless: true });
    expect(getAutoFeeder(addOnInfo)).toBe(true);
  });

  it('should call getAddOnInfo if not provided', () => {
    const addOnInfo = { autoFeeder: true };

    mockGetAddOnInfo.mockReturnValue(addOnInfo);
    mockGetState.mockReturnValue({ 'auto-feeder': true, workarea: 'model' });
    expect(getAutoFeeder()).toBe(true);
    expect(mockGetAddOnInfo).toHaveBeenCalledTimes(1);
    expect(mockGetAddOnInfo).toHaveBeenLastCalledWith('model');
  });
});

describe('test getPassThrough', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return false if addOnInfo not support', () => {
    const addOnInfo = { passThrough: false } as unknown as AddOnInfo;

    expect(getPassThrough(addOnInfo)).toBe(false);
    expect(mockGetAddOnInfo).not.toHaveBeenCalled();
  });

  it('should return false when model supports but preference is false', () => {
    const addOnInfo = { passThrough: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ 'pass-through': false });
    expect(getPassThrough(addOnInfo)).toBe(false);
  });

  it('should return false when model supports but borderless is false', () => {
    const addOnInfo = { openBottom: true, passThrough: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ borderless: false, 'pass-through': true });
    expect(getPassThrough(addOnInfo)).toBe(false);
  });

  it('should return true when model supports and preference is true', () => {
    const addOnInfo = { passThrough: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ 'pass-through': true });
    expect(getPassThrough(addOnInfo)).toBe(true);
  });

  it('should return true when model, borderless and preference is true', () => {
    const addOnInfo = { openBottom: true, passThrough: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ borderless: true, 'pass-through': true });
    expect(getPassThrough(addOnInfo)).toBe(true);
  });

  it('should call getAddOnInfo if not provided', () => {
    const addOnInfo = { passThrough: true };

    mockGetAddOnInfo.mockReturnValue(addOnInfo);
    mockGetState.mockReturnValue({ 'pass-through': true, workarea: 'model' });
    expect(getPassThrough()).toBe(true);
    expect(mockGetAddOnInfo).toHaveBeenCalledTimes(1);
    expect(mockGetAddOnInfo).toHaveBeenLastCalledWith('model');
  });
});
