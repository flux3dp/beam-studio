import cloud from './cloud';

const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
}));

const mockPost = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  axiosFluxId: {
    post: (...args) => mockPost(...args),
  },
  fluxIDEvents: { addListener: () => {} },
  getCurrentUser: (...args) => mockGetCurrentUser(...args),
}));

const mockToISOString = jest.spyOn(Date.prototype, 'toISOString');

describe('test cloud api', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.FLUX.version = '1.0.0';
  });

  test('recordActivity should work when logged in', async () => {
    mockGetCurrentUser.mockReturnValueOnce('user');
    mockToISOString.mockReturnValueOnce('2023-05-15T00:00:00.000Z');
    mockGet.mockReturnValueOnce('2023-05-14');
    mockPost.mockResolvedValueOnce({ data: { status: 'ok' } });
    await cloud.recordActivity();
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenNthCalledWith(1, 'last-record-activity');
    expect(mockToISOString).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      '/user/activity/beam-studio',
      { version: '1.0.0' },
      { withCredentials: true },
    );
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenNthCalledWith(1, 'last-record-activity', '2023-05-15');
  });

  test('recordActivity should work when not logged in', async () => {
    mockGetCurrentUser.mockReturnValueOnce(null);
    await cloud.recordActivity();
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  test('recordActivity should work when already recorded', async () => {
    mockGetCurrentUser.mockReturnValueOnce('user');
    mockToISOString.mockReturnValueOnce('2023-05-15T00:00:00.000Z');
    mockGet.mockReturnValueOnce('2023-05-15');
    await cloud.recordActivity();
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenNthCalledWith(1, 'last-record-activity');
    expect(mockToISOString).toHaveBeenCalledTimes(1);
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });
});
