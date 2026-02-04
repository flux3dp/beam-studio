import { calibrateWithDevicePictures, getMaterialHeight, prepareToTakePicture, saveCheckPoint } from './utils';

const mockEnterRawMode = jest.fn();
const mockRawHome = jest.fn();
const mockRawHomeZ = jest.fn();
const mockRawStartLineCheckMode = jest.fn();
const mockRawMove = jest.fn();
const mockRawEndLineCheckMode = jest.fn();
const mockRawAutoFocus = jest.fn();
const mockRawGetProbePos = jest.fn();
const mockEndSubTask = jest.fn();
const mockGetCurrentDevice = jest.fn();
const mockRawLooseMotor = jest.fn();
const mockUploadToDirectory = jest.fn();
const mockLs = jest.fn();
const mockDownloadFile = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  downloadFile: (...args) => mockDownloadFile(...args),
  endSubTask: (...args) => mockEndSubTask(...args),
  enterRawMode: (...args) => mockEnterRawMode(...args),
  ls: (...args) => mockLs(...args),
  rawAutoFocus: (...args) => mockRawAutoFocus(...args),
  rawEndLineCheckMode: (...args) => mockRawEndLineCheckMode(...args),
  rawGetProbePos: (...args) => mockRawGetProbePos(...args),
  rawHome: (...args) => mockRawHome(...args),
  rawHomeZ: (...args) => mockRawHomeZ(...args),
  rawLooseMotor: (...args) => mockRawLooseMotor(...args),
  rawMove: (...args) => mockRawMove(...args),
  rawStartLineCheckMode: (...args) => mockRawStartLineCheckMode(...args),
  uploadToDirectory: (...args) => mockUploadToDirectory(...args),
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockOpenSteppingProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openSteppingProgress: (...args) => mockOpenSteppingProgress(...args),
  popById: (...args) => mockPopById(...args),
  update: (...args) => mockUpdate(...args),
}));

const mockAddFisheyeCalibrateImg = jest.fn();
const mockDoFishEyeCalibration = jest.fn();
const mockStartFisheyeCalibrate = jest.fn();

jest.mock('@core/helpers/camera-calibration-helper', () => ({
  addFisheyeCalibrateImg: (...args) => mockAddFisheyeCalibrateImg(...args),
  doFishEyeCalibration: (...args) => mockDoFishEyeCalibration(...args),
  startFisheyeCalibrate: (...args) => mockStartFisheyeCalibrate(...args),
}));

jest.mock('@core/helpers/duration-formatter', () => (time: number) => `${time.toFixed(2)} s`);
jest.mock('@core/helpers/i18n', () => ({
  lang: {
    calibration: {
      calibrating_with_device_pictures: 'calibrating_with_device_pictures',
      downloading_pictures: 'downloading_pictures',
      failed_to_calibrate_with_pictures: 'failed_to_calibrate_with_pictures',
    },
    camera_data_backup: {
      estimated_time_left: 'estimated_time_left',
    },
  },
}));

const mockDateNow = jest.fn();

describe('test AdorCalibrationV2 utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Date.now = mockDateNow;

    let t = 0;

    mockDateNow.mockImplementation(() => {
      t += 1000;

      return t;
    });
  });

  it('should work for getMaterialHeight', async () => {
    mockGetWorkarea.mockReturnValue({ cameraCenter: [100, 100], deep: 100 });
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'model-1' } });
    mockRawGetProbePos.mockResolvedValue({ didAf: true, z: 10 });

    const res = await getMaterialHeight();

    expect(mockGetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetWorkarea).toHaveBeenLastCalledWith('model-1', 'ado1');
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawStartLineCheckMode).toHaveBeenCalledTimes(1);
    expect(mockRawMove).toHaveBeenCalledTimes(2);
    expect(mockRawMove).toHaveBeenNthCalledWith(1, { f: 7500, x: 100, y: 100 });
    expect(mockRawMove).toHaveBeenNthCalledWith(2, { f: 7500, x: 0, y: 0 });
    expect(mockRawEndLineCheckMode).toHaveBeenCalledTimes(1);
    expect(mockRawAutoFocus).toHaveBeenCalledTimes(1);
    expect(mockRawGetProbePos).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
    expect(res).toBe(90);
  });

  test('prepareToTakePicture', async () => {
    await prepareToTakePicture();
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawHomeZ).toHaveBeenCalledTimes(1);
    expect(mockEndSubTask).toHaveBeenCalledTimes(1);
  });

  test('saveCheckPoint', async () => {
    const mockStringify = jest.fn();

    mockStringify.mockReturnValue('123');
    JSON.stringify = mockStringify;
    await saveCheckPoint({
      d: [[1]],
      k: [[1]],
      rvec: [[1]],
      rvec_polyfit: [[1]],
      tvec: [[1]],
      tvec_polyfit: [[1]],
    });
    expect(mockStringify).toHaveBeenCalledTimes(1);
    expect(mockStringify).toHaveBeenLastCalledWith({
      d: [[1]],
      k: [[1]],
      rvec: [[1]],
      rvec_polyfit: [[1]],
      tvec: [[1]],
      tvec_polyfit: [[1]],
    });
    expect(mockUploadToDirectory).toHaveBeenCalledTimes(1);
    expect(mockUploadToDirectory).toHaveBeenLastCalledWith(expect.any(Blob), 'fisheye', 'checkpoint.json');
  });

  test('calibrateWithDevicePictures', async () => {
    mockLs.mockResolvedValue({
      files: ['pic_-10.0_top_left.jpg', 'pic_20.0_top_left.jpg', 'some-random.jpg'],
    });
    mockDownloadFile.mockImplementation(async (dirName: string, name: string, onProgress) => {
      onProgress({ left: 50, size: 100 });

      const mockBlob = `${dirName}/${name}`;

      return ['info', mockBlob];
    });
    mockAddFisheyeCalibrateImg.mockResolvedValue(true);
    mockDoFishEyeCalibration.mockImplementation((onProgress) => {
      onProgress(0.25);
      onProgress(0.75);

      return { d: 2, k: 1, rvec: 3, rvec_polyfit: 5, tvec: 4, tvec_polyfit: 6 };
    });

    const res = await calibrateWithDevicePictures();

    expect(res).toEqual({ d: 2, k: 1, rvec: 3, rvec_polyfit: 5, tvec: 4, tvec_polyfit: 6 });
    expect(mockOpenSteppingProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenSteppingProgress).toHaveBeenLastCalledWith({
      id: 'calibrate-with-device-pictures',
      message: 'downloading_pictures',
      onCancel: expect.any(Function),
    });
    expect(mockLs).toHaveBeenCalledTimes(1);
    expect(mockLs).toHaveBeenLastCalledWith('camera_calib');
    expect(mockStartFisheyeCalibrate).toHaveBeenCalledTimes(1);
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    expect(mockDownloadFile).toHaveBeenNthCalledWith(1, 'camera_calib', 'pic_-10.0_top_left.jpg', expect.any(Function));
    expect(mockDownloadFile).toHaveBeenNthCalledWith(2, 'camera_calib', 'pic_20.0_top_left.jpg', expect.any(Function));
    expect(mockAddFisheyeCalibrateImg).toHaveBeenCalledTimes(2);
    expect(mockAddFisheyeCalibrateImg).toHaveBeenNthCalledWith(1, -10, 'camera_calib/pic_-10.0_top_left.jpg');
    expect(mockAddFisheyeCalibrateImg).toHaveBeenNthCalledWith(2, 20, 'camera_calib/pic_20.0_top_left.jpg');
    expect(mockDoFishEyeCalibration).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(5);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 'calibrate-with-device-pictures', {
      message: 'downloading_pictures 1/2<br/>estimated_time_left 3.00 s',
      percentage: 25,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 'calibrate-with-device-pictures', {
      message: 'downloading_pictures 2/2<br/>estimated_time_left 0.67 s',
      percentage: 75,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(3, 'calibrate-with-device-pictures', {
      message: 'calibrating_with_device_pictures',
      percentage: 0,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(4, 'calibrate-with-device-pictures', {
      message: 'calibrating_with_device_pictures<br/>estimated_time_left 3.00 s',
      percentage: 25,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(5, 'calibrate-with-device-pictures', {
      message: 'calibrating_with_device_pictures<br/>estimated_time_left 0.67 s',
      percentage: 75,
    });
  });
});
