import moveLaserHead from './moveLaserHead';

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockGetCurrentControlMode = jest.fn();
const mockEnterRawMode = jest.fn();
const mockRawHome = jest.fn();
const mockRawStartLineCheckMod = jest.fn();
const mockRawMove = jest.fn();
const mockRawEndLineCheckMode = jest.fn();
const mockRawLooseMotor = jest.fn();
const mockEndSubTask = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  currentDevice: {
    info: {
      model: 'fbb2',
    },
  },
  endSubTask: (...args) => mockEndSubTask(...args),
  enterRawMode: (...args) => mockEnterRawMode(...args),
  rawEndLineCheckMode: (...args) => mockRawEndLineCheckMode(...args),
  rawHome: (...args) => mockRawHome(...args),
  rawLooseMotor: (...args) => mockRawLooseMotor(...args),
  rawMove: (...args) => mockRawMove(...args),
  rawStartLineCheckMode: (...args) => mockRawStartLineCheckMod(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    calibration: {
      failed_to_move_laser_head: 'failed_to_move_laser_head',
      moving_laser_head: 'moving_laser_head',
    },
  },
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockConsoleError = jest.fn();

describe('moveLaserHead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkarea.mockReturnValue({
      cameraCenter: [50, 50],
      height: 100,
      width: 100,
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
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawStartLineCheckMod).toHaveBeenCalledTimes(1);
    expect(mockGetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetWorkarea).toHaveBeenCalledWith('fbb2', 'fbb2');
    expect(mockRawMove).toHaveBeenCalledTimes(1);
    expect(mockRawMove).toHaveBeenCalledWith({ f: 7500, x: 50, y: 50 });
    expect(mockRawEndLineCheckMode).toHaveBeenCalledTimes(1);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('move-laser-head');
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('when home failed', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');

    const mockError = new Error('error');

    mockRawHome.mockRejectedValueOnce(mockError);

    const res = await moveLaserHead();

    expect(res).toBe(false);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawStartLineCheckMod).not.toHaveBeenCalled();
    expect(mockGetWorkarea).not.toHaveBeenCalled();
    expect(mockRawMove).not.toHaveBeenCalled();
    expect(mockRawEndLineCheckMode).not.toHaveBeenCalled();
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('move-laser-head');
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'failed_to_move_laser_head' });
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(mockError);
  });

  test('when failed after line check mode', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');

    const mockError = new Error('error');

    mockRawMove.mockRejectedValueOnce(mockError);

    const res = await moveLaserHead();

    expect(res).toBe(false);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawStartLineCheckMod).toHaveBeenCalledTimes(1);
    expect(mockGetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetWorkarea).toHaveBeenCalledWith('fbb2', 'fbb2');
    expect(mockRawMove).toHaveBeenCalledTimes(1);
    expect(mockRawMove).toHaveBeenCalledWith({ f: 7500, x: 50, y: 50 });
    expect(mockRawEndLineCheckMode).toHaveBeenCalledTimes(1);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('move-laser-head');
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'failed_to_move_laser_head' });
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith(mockError);
  });
});
