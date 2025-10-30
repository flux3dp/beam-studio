import checkCamera from './check-camera';

const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockSelect = jest.fn();
const mockTakeOnePicture = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args) => mockConnectCamera(...args),
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  select: (...args) => mockSelect(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
}));

const mockConsoleLog = jest.fn();

describe('test check-camera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.console.log = mockConsoleLog;
  });

  it('should return true if everything works', async () => {
    mockSelect.mockResolvedValue({ success: true });
    mockConnectCamera.mockResolvedValue(null);
    mockTakeOnePicture.mockResolvedValue(null);
    mockDisconnectCamera.mockReturnValue(null);

    // @ts-expect-error testing checkCamera with fake data
    const res = await checkCamera('device');

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenLastCalledWith('device');
    expect(mockConnectCamera).toHaveBeenCalledTimes(1);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ success: true });
  });

  it('should retrun false when something went wrong', async () => {
    mockSelect.mockResolvedValue({ success: true });
    mockConnectCamera.mockResolvedValue(null);
    mockTakeOnePicture.mockRejectedValue('error');
    mockDisconnectCamera.mockReturnValue(null);

    // @ts-expect-error testing checkCamera with fake data
    const res = await checkCamera('device');

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenLastCalledWith('device');
    expect(mockConnectCamera).toHaveBeenCalledTimes(1);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockDisconnectCamera).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ success: false });
  });
});
