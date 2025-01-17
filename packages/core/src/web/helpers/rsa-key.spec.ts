/* eslint-disable import/first */
const mockIsExisting = jest.fn();
const mockSet = jest.fn();
const mockGet = jest.fn();
jest.mock('implementations/storage', () => ({
  isExisting: mockIsExisting,
  set: mockSet,
  get: mockGet,
}));

import rsaKey from './rsa-key';

describe('test rsa-key', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('create new key', () => {
    rsaKey(true);
    expect(mockIsExisting).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet.mock.calls[0][0]).toBe('flux-rsa-key');
  });

  test('don\'t create new key but storage has the existing key', () => {
    mockIsExisting.mockReturnValue(true);
    mockGet.mockReturnValue('12345');
    expect(rsaKey(false)).toBe('12345');
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockIsExisting).toHaveBeenCalledTimes(1);
    expect(mockIsExisting).toHaveBeenNthCalledWith(1, 'flux-rsa-key');
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenNthCalledWith(1, 'flux-rsa-key');
  });

  test('don\'t create new key and storage has no key either', () => {
    mockIsExisting.mockReturnValue(false);
    rsaKey(false);
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockIsExisting).toHaveBeenCalledTimes(1);
    expect(mockIsExisting).toHaveBeenNthCalledWith(1, 'flux-rsa-key');
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet.mock.calls[0][0]).toBe('flux-rsa-key');
  });
});
