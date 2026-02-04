const mockJSZip = jest.fn();

jest.doMock('jszip', () => ({
  __esModule: true,
  default: mockJSZip,
}));

import { downloadCameraData, targetDirs, uploadCameraData } from './camera-data-backup';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any) => mockPopUp(...args),
  popUpError: (...args: any) => mockPopUpError(...args),
}));

const mockLs = jest.fn();
const mockDownloadFile = jest.fn();
const mockUploadToDirectory = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  downloadFile: (...args: any) => mockDownloadFile(...args),
  ls: (...args: any) => mockLs(...args),
  uploadToDirectory: (...args: any) => mockUploadToDirectory(...args),
}));

const mockWriteFileDialog = jest.fn();
const mockGetFileFromDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  getFileFromDialog: (...args: any) => mockGetFileFromDialog(...args),
  writeFileDialog: (...args: any) => mockWriteFileDialog(...args),
}));

jest.mock('@core/helpers/duration-formatter', () => (sec: number) => `${sec.toFixed(2)} seconds`);

const mockOpenNonstopProgress = jest.fn();
const mockOpenSteppingProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args: any) => mockOpenNonstopProgress(...args),
  openSteppingProgress: (...args: any) => mockOpenSteppingProgress(...args),
  popById: (...args: any) => mockPopById(...args),
  update: (...args: any) => mockUpdate(...args),
}));

const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args: any) => mockGet(...args),
  set: (...args: any) => mockSet(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    camera_data_backup: {
      download_success: 'download_success',
      downloading_data: 'downloading_data',
      estimated_time_left: 'estimated_time_left',
      folder_not_exists: 'folder_not_exists',
      incorrect_folder: 'incorrect_folder',
      no_picture_found: 'no_picture_found',
      title: 'title',
      upload_success: 'upload_success',
      uploading_data: 'uploading_data',
    },
  },
}));

const mockDateNow = jest.fn();
const mockJsZipInstance = {
  file: jest.fn(),
  filter: jest.fn(),
  folder: jest.fn(),
  generateAsync: jest.fn(),
};
const mockLoadAsync = jest.fn();

describe('test camera-data-backup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error mocking JSZip.loadAsync
    mockJSZip.loadAsync = mockLoadAsync;
    Date.now = mockDateNow;

    let t = 0;

    mockDateNow.mockImplementation(() => {
      t += 1000;

      return t;
    });
  });

  const checkDownloadFiles = () => {
    expect(mockOpenSteppingProgress).toHaveBeenCalledTimes(targetDirs.length);
    expect(mockOpenSteppingProgress).toHaveBeenNthCalledWith(1, {
      id: 'camera-data-backup',
      message: 'downloading_data',
      onCancel: expect.any(Function),
    });
    expect(mockOpenSteppingProgress).toHaveBeenNthCalledWith(2, {
      id: 'camera-data-backup',
      message: 'downloading_data',
      onCancel: expect.any(Function),
    });
    expect(mockOpenSteppingProgress).toHaveBeenNthCalledWith(3, {
      id: 'camera-data-backup',
      message: 'downloading_data',
      onCancel: expect.any(Function),
    });
    expect(mockPopById).toHaveBeenCalledTimes(targetDirs.length + 2);
    expect(mockUpdate).toHaveBeenCalledTimes(targetDirs.length * 2);
    expect(mockDownloadFile).toHaveBeenCalledTimes(targetDirs.length * 2);
    expect(mockJsZipInstance.folder).toHaveBeenCalledTimes(targetDirs.length);
    expect(mockJsZipInstance.file).toHaveBeenCalledTimes(targetDirs.length * 2);
    for (let i = 0; i < targetDirs.length; i++) {
      expect(mockUpdate).toHaveBeenNthCalledWith(i * 2 + 1, 'camera-data-backup', {
        message: `downloading_data ${targetDirs[i]} 1/2<br/>estimated_time_left 3.00 seconds`,
        percentage: 25,
      });
      expect(mockUpdate).toHaveBeenNthCalledWith(i * 2 + 2, 'camera-data-backup', {
        message: `downloading_data ${targetDirs[i]} 2/2<br/>estimated_time_left 0.67 seconds`,
        percentage: 75,
      });
      expect(mockDownloadFile).toHaveBeenNthCalledWith(i * 2 + 1, targetDirs[i], 'file1', expect.any(Function));
      expect(mockDownloadFile).toHaveBeenNthCalledWith(i * 2 + 2, targetDirs[i], 'file2', expect.any(Function));
      expect(mockJsZipInstance.folder).toHaveBeenNthCalledWith(i + 1, targetDirs[i]);
      expect(mockJsZipInstance.file).toHaveBeenNthCalledWith(
        i * 2 + 1,
        `${targetDirs[i]}/file1`,
        `${targetDirs[i]}/file1`,
      );
      expect(mockJsZipInstance.file).toHaveBeenNthCalledWith(
        i * 2 + 2,
        `${targetDirs[i]}/file2`,
        `${targetDirs[i]}/file2`,
      );
    }
  };

  test('successfully download camera data', async () => {
    mockJSZip.mockImplementation(() => mockJsZipInstance);
    mockLs.mockResolvedValue({ files: ['file1', 'file2'] });
    mockWriteFileDialog.mockResolvedValue('path');
    mockDownloadFile.mockImplementation(async (dirName: string, name: string, onProgress) => {
      onProgress({ left: 50, size: 100 });

      const mockBlob = `${dirName}/${name}`;

      return ['info', mockBlob];
    });
    await downloadCameraData('deviceName');
    checkDownloadFiles();
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({ message: 'download_success' });
    expect(mockJsZipInstance.generateAsync).not.toHaveBeenCalled();
    mockJsZipInstance.generateAsync.mockResolvedValue('blob');
    expect(mockWriteFileDialog).toHaveBeenCalledTimes(1);
    expect(mockWriteFileDialog).toHaveBeenCalledWith(expect.any(Function), 'title', 'deviceName', [
      { extensions: ['zip'], name: 'zip' },
    ]);

    const getContent = mockWriteFileDialog.mock.calls[0][0];
    const content = await getContent();

    expect(content).toBe('blob');
    expect(mockJsZipInstance.generateAsync).toHaveBeenCalledTimes(1);
    expect(mockJsZipInstance.generateAsync).toHaveBeenNthCalledWith(1, { type: 'blob' });
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('ador-backup-path', 'path');
  });

  test('download with no files', async () => {
    mockLs.mockResolvedValue({ files: [] });
    await downloadCameraData('deviceName');
    expect(mockPopUpError).toHaveBeenCalledTimes(1);
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'no_picture_found' });
    expect(mockWriteFileDialog).not.toHaveBeenCalled();
  });

  test('download with no path selected', async () => {
    mockJSZip.mockImplementation(() => mockJsZipInstance);
    mockLs.mockResolvedValue({ files: ['file1', 'file2'] });
    mockWriteFileDialog.mockResolvedValue(null);
    mockDownloadFile.mockImplementation(async (dirName: string, name: string, onProgress) => {
      onProgress({ left: 50, size: 100 });

      const mockBlob = `${dirName}/${name}`;

      return ['info', mockBlob];
    });
    await downloadCameraData('deviceName');
    checkDownloadFiles();
    expect(mockPopUp).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  test('successfully upload', async () => {
    mockGet.mockReturnValue('path');
    mockGetFileFromDialog.mockResolvedValue({
      arrayBuffer: () => Promise.resolve('arrayBuffer'),
    });
    mockLoadAsync.mockResolvedValue(mockJsZipInstance);
    mockJsZipInstance.filter.mockReturnValue([
      { length: 1, name: 'camera_calib/file1' },
      { length: 2, name: 'camera_calib/file2' },
      { length: 3, name: 'auto_leveling/file1' },
      { length: 0, name: 'auto_leveling/file2' },
    ]);

    const mockAsyncGetData = jest.fn();

    mockJsZipInstance.file.mockImplementation(() => ({
      async: mockAsyncGetData,
    }));
    mockAsyncGetData
      .mockResolvedValueOnce({ name: 'file1', size: 1 })
      .mockResolvedValueOnce({ name: 'file2', size: 2 })
      .mockResolvedValueOnce({ name: 'file1', size: 3 })
      .mockResolvedValueOnce({ name: 'file2', size: 0 });

    mockUploadToDirectory.mockImplementation(async (blob, dir, filename, onProgress) => {
      onProgress({ step: 50, total: 100 });
    });

    await uploadCameraData();
    expect(mockGetFileFromDialog).toHaveBeenCalledTimes(1);
    expect(mockGetFileFromDialog).toHaveBeenCalledWith({
      defaultPath: 'path',
      filters: [{ extensions: ['zip'], name: 'zip' }],
      properties: ['openFile'],
    });
    expect(mockOpenSteppingProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenSteppingProgress).toHaveBeenCalledWith({
      id: 'camera-data-backup',
      message: 'uploading_data',
      onCancel: expect.any(Function),
    });
    expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    expect(mockLoadAsync).toHaveBeenCalledWith('arrayBuffer');
    expect(mockJsZipInstance.filter).toHaveBeenCalledTimes(1);

    const filterFunction = mockJsZipInstance.filter.mock.calls[0][0];

    expect(filterFunction('camera_calib/file1', { dir: false })).toBe(true);
    expect(filterFunction('camera_calib/file2', { dir: false })).toBe(true);
    expect(filterFunction('camera_calib/some-sub-folder/file', { dir: false })).toBe(false);
    expect(filterFunction('auto_leveling', { dir: true })).toBe(false);
    expect(mockAsyncGetData).toHaveBeenCalledTimes(4);
    expect(mockAsyncGetData).toHaveBeenCalledWith('blob');
    expect(mockUploadToDirectory).toHaveBeenCalledTimes(3);
    expect(mockUploadToDirectory).toHaveBeenCalledWith(
      { name: 'file1', size: 1 },
      'camera_calib',
      'file1',
      expect.any(Function),
    );
    expect(mockUploadToDirectory).toHaveBeenCalledWith(
      { name: 'file2', size: 2 },
      'camera_calib',
      'file2',
      expect.any(Function),
    );
    expect(mockUploadToDirectory).toHaveBeenCalledWith(
      { name: 'file1', size: 3 },
      'auto_leveling',
      'file1',
      expect.any(Function),
    );
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    expect(mockUpdate).toHaveBeenCalledWith('camera-data-backup', {
      message: 'uploading_data 1/4<br/>estimated_time_left 7.00 seconds',
      percentage: 13,
    });
    expect(mockUpdate).toHaveBeenCalledWith('camera-data-backup', {
      message: 'uploading_data 2/4<br/>estimated_time_left 3.33 seconds',
      percentage: 38,
    });
    expect(mockUpdate).toHaveBeenCalledWith('camera-data-backup', {
      message: 'uploading_data 3/4<br/>estimated_time_left 1.80 seconds',
      percentage: 63,
    });
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({ message: 'upload_success' });
  });

  test('upload with no file selected', async () => {
    mockGetFileFromDialog.mockResolvedValue(null);
    await uploadCameraData();
    expect(mockGetFileFromDialog).toHaveBeenCalledTimes(1);
    expect(mockOpenSteppingProgress).not.toHaveBeenCalled();
    expect(mockUploadToDirectory).not.toHaveBeenCalled();
    expect(mockPopUp).not.toHaveBeenCalled();
    expect(mockLoadAsync).not.toHaveBeenCalled();
  });

  test('upload with no file in zip', async () => {
    mockGetFileFromDialog.mockResolvedValue({
      arrayBuffer: () => Promise.resolve('arrayBuffer'),
    });
    mockLoadAsync.mockResolvedValue(mockJsZipInstance);
    mockJsZipInstance.filter.mockReturnValue([]);
    await uploadCameraData();
    expect(mockGetFileFromDialog).toHaveBeenCalledTimes(1);
    expect(mockOpenSteppingProgress).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockUploadToDirectory).not.toHaveBeenCalled();
    expect(mockPopUpError).toHaveBeenCalledTimes(1);
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'incorrect_folder' });
  });
});
