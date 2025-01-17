import moveLaserHead from './moveLaserHead';

const mockPopUpError = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockGetCurrentControlMode = jest.fn();
const mockEnterRawMode = jest.fn();
const mockRawHome = jest.fn();
const mockRawStartLineCheckMod = jest.fn();
const mockRawMove = jest.fn();
const mockRawEndLineCheckMode = jest.fn();
const mockRawLooseMotor = jest.fn();
const mockEndRawMode = jest.fn();
jest.mock('helpers/device-master', () => ({
  currentDevice: {
    info: {
      model: 'fbb2',
    },
  },
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  enterRawMode: (...args) => mockEnterRawMode(...args),
  rawHome: (...args) => mockRawHome(...args),
  rawStartLineCheckMode: (...args) => mockRawStartLineCheckMod(...args),
  rawMove: (...args) => mockRawMove(...args),
  rawEndLineCheckMode: (...args) => mockRawEndLineCheckMode(...args),
  rawLooseMotor: (...args) => mockRawLooseMotor(...args),
  endRawMode: (...args) => mockEndRawMode(...args),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    calibration: {
      moving_laser_head: 'moving_laser_head',
      failed_to_move_laser_head: 'failed_to_move_laser_head',
    },
  },
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockGetWorkarea = jest.fn();
jest.mock('app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockConsoleError = jest.fn();
describe('moveLaserHead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkarea.mockReturnValue({
      width: 100,
      height: 100,
      cameraCenter: [50, 50],
    });
    console.error = mockConsoleError;
  });

  test('should return true when moveLaserHead is successful', async () => {
    mockGetCurrentControlMode.mockReturnValue('control');
    const res = await moveLaserHead();
    expect(res).toBe(true);
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'move-laser-head',
      message: 'moving_laser_head',
    });
    expect(mockEnterRawMode).toBeCalledTimes(1);
    expect(mockRawHome).toBeCalledTimes(1);
    expect(mockRawStartLineCheckMod).toBeCalledTimes(1);
    expect(mockGetWorkarea).toBeCalledTimes(1);
    expect(mockGetWorkarea).toBeCalledWith('fbb2', 'fbb2');
    expect(mockRawMove).toBeCalledTimes(1);
    expect(mockRawMove).toBeCalledWith({ x: 50, y: 50, f: 7500 });
    expect(mockRawEndLineCheckMode).toBeCalledTimes(1);
    expect(mockRawLooseMotor).toBeCalledTimes(1);
    expect(mockEndRawMode).toBeCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('move-laser-head');
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('when home failed', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    const mockError = new Error('error');
    mockRawHome.mockRejectedValueOnce(mockError);
    const res = await moveLaserHead();
    expect(res).toBe(false);
    expect(mockEnterRawMode).toBeCalledTimes(1);
    expect(mockRawHome).toBeCalledTimes(1);
    expect(mockRawStartLineCheckMod).not.toHaveBeenCalled();
    expect(mockGetWorkarea).not.toHaveBeenCalled();
    expect(mockRawMove).not.toHaveBeenCalled();
    expect(mockRawEndLineCheckMode).not.toHaveBeenCalled();
    expect(mockRawLooseMotor).toBeCalledTimes(1);
    expect(mockEndRawMode).toBeCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('move-laser-head');
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'failed_to_move_laser_head' });
    expect(mockConsoleError).toBeCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(mockError);
  });

  test('when failed after line check mode', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    const mockError = new Error('error');
    mockRawMove.mockRejectedValueOnce(mockError);
    const res = await moveLaserHead();
    expect(res).toBe(false);
    expect(mockEnterRawMode).toBeCalledTimes(1);
    expect(mockRawHome).toBeCalledTimes(1);
    expect(mockRawStartLineCheckMod).toBeCalledTimes(1);
    expect(mockGetWorkarea).toBeCalledTimes(1);
    expect(mockGetWorkarea).toBeCalledWith('fbb2', 'fbb2');
    expect(mockRawMove).toBeCalledTimes(1);
    expect(mockRawMove).toBeCalledWith({ x: 50, y: 50, f: 7500 });
    expect(mockRawEndLineCheckMode).toBeCalledTimes(1);
    expect(mockRawLooseMotor).toBeCalledTimes(1);
    expect(mockEndRawMode).toBeCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('move-laser-head');
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'failed_to_move_laser_head' });
    expect(mockConsoleError).toBeCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(mockError);
  });
});
