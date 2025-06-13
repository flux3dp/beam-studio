import moveZRel from './moveZRel';

const mockEnterRawMode = jest.fn();
const mockRawMoveZRel = jest.fn();
const mockEndSubTask = jest.fn();
const mockGetCurrentControlMode = jest.fn();
const mockSetTimeout = jest.spyOn(global, 'setTimeout');

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  endSubTask: (...args: any) => mockEndSubTask(...args),
  enterRawMode: (...args: any) => mockEnterRawMode(...args),
  rawMoveZRel: (...args: any) => mockRawMoveZRel(...args),
}));

describe('test moveZRel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentControlMode.mockReturnValue('');
    mockSetTimeout.mockImplementation((cb) => {
      cb();

      return 0 as unknown as NodeJS.Timeout;
    });
  });

  it('should work without error', async () => {
    await moveZRel(10);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawMoveZRel).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockSetTimeout).toHaveBeenCalledTimes(1);
  });

  it('should exit raw mode if error occurs', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');

    const error = new Error('test error');

    mockRawMoveZRel.mockRejectedValue(error);
    try {
      await moveZRel(10);
    } catch (e) {
      expect(e).toEqual(error);
    }
    expect(mockSetTimeout).not.toHaveBeenCalled();
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
  });
});
