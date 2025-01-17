/* eslint-disable @typescript-eslint/no-explicit-any */
const mockJSZip = jest.fn();
jest.mock('jszip', () => ({
  __esModule: true,
  default: mockJSZip,
}));

// eslint-disable-next-line import/first
import { downloadCameraData, uploadCameraData, targetDirs } from './camera-data-backup';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args: any) => mockPopUp(...args),
  popUpError: (...args: any) => mockPopUpError(...args),
}));

const mockLs = jest.fn();
const mockDownloadFile = jest.fn();
const mockUploadToDirectory = jest.fn();
jest.mock('helpers/device-master', () => ({
  ls: (...args: any) => mockLs(...args),
  downloadFile: (...args: any) => mockDownloadFile(...args),
  uploadToDirectory: (...args: any) => mockUploadToDirectory(...args),
}));

const mockWriteFileDialog = jest.fn();
const mockGetFileFromDialog = jest.fn();
jest.mock('implementations/dialog', () => ({
  writeFileDialog: (...args: any) => mockWriteFileDialog(...args),
  getFileFromDialog: (...args: any) => mockGetFileFromDialog(...args),
}));

jest.mock('helpers/duration-formatter', () => (sec: number) => `${sec.toFixed(2)} seconds`);

const mockOpenNonstopProgress = jest.fn();
const mockOpenSteppingProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args: any) => mockOpenNonstopProgress(...args),
  openSteppingProgress: (...args: any) => mockOpenSteppingProgress(...args),
  update: (...args: any) => mockUpdate(...args),
  popById: (...args: any) => mockPopById(...args),
}));

const mockGet = jest.fn();
const mockSet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args: any) => mockGet(...args),
  set: (...args: any) => mockSet(...args),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    camera_data_backup: {
      no_picture_found: 'no_picture_found',
      downloading_data: 'downloading_data',
      estimated_time_left: 'estimated_time_left',
      folder_not_exists: 'folder_not_exists',
      incorrect_folder: 'incorrect_folder',
      uploading_data: 'uploading_data',
      title: 'title',
      download_success: 'download_success',
      upload_success: 'upload_success',
    },
  },
}));

const mockDateNow = jest.fn();
const mockJsZipInstance = {
  folder: jest.fn(),
  file: jest.fn(),
  generateAsync: jest.fn(),
  filter: jest.fn(),
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
    expect(mockPopById).toBeCalledTimes(targetDirs.length + 2);
    expect(mockUpdate).toBeCalledTimes(targetDirs.length * 2);
    expect(mockDownloadFile).toBeCalledTimes(targetDirs.length * 2);
    expect(mockJsZipInstance.folder).toBeCalledTimes(targetDirs.length);
    expect(mockJsZipInstance.file).toBeCalledTimes(targetDirs.length * 2);
    for (let i = 0; i < targetDirs.length; i++) {
      expect(mockUpdate).toHaveBeenNthCalledWith(i * 2 + 1, 'camera-data-backup', {
        message: `downloading_data ${targetDirs[i]} 1/2<br/>estimated_time_left 3.00 seconds`,
        percentage: 25,
      });
      expect(mockUpdate).toHaveBeenNthCalledWith(i * 2 + 2, 'camera-data-backup', {
        message: `downloading_data ${targetDirs[i]} 2/2<br/>estimated_time_left 0.67 seconds`,
        percentage: 75,
      });
      expect(mockDownloadFile).toHaveBeenNthCalledWith(
        i * 2 + 1,
        targetDirs[i],
        'file1',
        expect.any(Function)
      );
      expect(mockDownloadFile).toHaveBeenNthCalledWith(
        i * 2 + 2,
        targetDirs[i],
        'file2',
        expect.any(Function)
      );
      expect(mockJsZipInstance.folder).toHaveBeenNthCalledWith(i + 1, targetDirs[i]);
      expect(mockJsZipInstance.file).toHaveBeenNthCalledWith(
        i * 2 + 1,
        `${targetDirs[i]}/file1`,
        `${targetDirs[i]}/file1`
      );
      expect(mockJsZipInstance.file).toHaveBeenNthCalledWith(
        i * 2 + 2,
        `${targetDirs[i]}/file2`,
        `${targetDirs[i]}/file2`
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
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toBeCalledWith({ message: 'download_success' });
    expect(mockJsZipInstance.generateAsync).not.toBeCalled();
    mockJsZipInstance.generateAsync.mockResolvedValue('blob');
    expect(mockWriteFileDialog).toBeCalledTimes(1);
    expect(mockWriteFileDialog).toBeCalledWith(expect.any(Function), 'title', 'deviceName', [
      { name: 'zip', extensions: ['zip'] },
    ]);
    const getContent = mockWriteFileDialog.mock.calls[0][0];
    const content = await getContent();
    expect(content).toBe('blob');
    expect(mockJsZipInstance.generateAsync).toBeCalledTimes(1);
    expect(mockJsZipInstance.generateAsync).toHaveBeenNthCalledWith(1, { type: 'blob' });
    expect(mockSet).toBeCalledTimes(1);
    expect(mockSet).toBeCalledWith('ador-backup-path', 'path');
  });

  test('download with no files', async () => {
    mockLs.mockResolvedValue({ files: [] });
    await downloadCameraData('deviceName');
    expect(mockPopUpError).toBeCalledTimes(1);
    expect(mockPopUpError).toBeCalledWith({ message: 'no_picture_found' });
    expect(mockWriteFileDialog).not.toBeCalled();
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
    expect(mockPopUp).not.toBeCalled();
    expect(mockSet).not.toBeCalled();
  });

  test('successfully upload', async () => {
    mockGet.mockReturnValue('path');
    mockGetFileFromDialog.mockResolvedValue({
      arrayBuffer: () => Promise.resolve('arrayBuffer'),
    });
    mockLoadAsync.mockResolvedValue(mockJsZipInstance);
    mockJsZipInstance.filter.mockReturnValue([
      { name: 'camera_calib/file1', length: 1 },
      { name: 'camera_calib/file2', length: 2 },
      { name: 'auto_leveling/file1', length: 3 },
      { name: 'auto_leveling/file2', length: 0 },
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
    expect(mockGetFileFromDialog).toBeCalledTimes(1);
    expect(mockGetFileFromDialog).toBeCalledWith({
      defaultPath: 'path',
      properties: ['openFile'],
      filters: [{ name: 'zip', extensions: ['zip'] }],
    });
    expect(mockOpenSteppingProgress).toBeCalledTimes(1);
    expect(mockOpenSteppingProgress).toBeCalledWith({
      id: 'camera-data-backup',
      message: 'uploading_data',
      onCancel: expect.any(Function),
    });
    expect(mockLoadAsync).toBeCalledTimes(1);
    expect(mockLoadAsync).toBeCalledWith('arrayBuffer');
    expect(mockJsZipInstance.filter).toBeCalledTimes(1);
    const filterFunction = mockJsZipInstance.filter.mock.calls[0][0];
    expect(filterFunction('camera_calib/file1', { dir: false })).toBe(true);
    expect(filterFunction('camera_calib/file2', { dir: false })).toBe(true);
    expect(filterFunction('camera_calib/some-sub-folder/file', { dir: false })).toBe(false);
    expect(filterFunction('auto_leveling', { dir: true })).toBe(false);
    expect(mockAsyncGetData).toBeCalledTimes(4);
    expect(mockAsyncGetData).toBeCalledWith('blob');
    expect(mockUploadToDirectory).toBeCalledTimes(3);
    expect(mockUploadToDirectory).toBeCalledWith(
      { name: 'file1', size: 1 },
      'camera_calib',
      'file1',
      expect.any(Function)
    );
    expect(mockUploadToDirectory).toBeCalledWith(
      { name: 'file2', size: 2 },
      'camera_calib',
      'file2',
      expect.any(Function)
    );
    expect(mockUploadToDirectory).toBeCalledWith(
      { name: 'file1', size: 3 },
      'auto_leveling',
      'file1',
      expect.any(Function)
    );
    expect(mockUpdate).toBeCalledTimes(3);
    expect(mockUpdate).toBeCalledWith('camera-data-backup', {
      message: 'uploading_data 1/4<br/>estimated_time_left 7.00 seconds',
      percentage: 13,
    });
    expect(mockUpdate).toBeCalledWith('camera-data-backup', {
      message: 'uploading_data 2/4<br/>estimated_time_left 3.33 seconds',
      percentage: 38,
    });
    expect(mockUpdate).toBeCalledWith('camera-data-backup', {
      message: 'uploading_data 3/4<br/>estimated_time_left 1.80 seconds',
      percentage: 63,
    });
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toBeCalledWith({ message: 'upload_success' });
  });

  test('upload with no file selected', async () => {
    mockGetFileFromDialog.mockResolvedValue(null);
    await uploadCameraData();
    expect(mockGetFileFromDialog).toBeCalledTimes(1);
    expect(mockOpenSteppingProgress).not.toBeCalled();
    expect(mockUploadToDirectory).not.toBeCalled();
    expect(mockPopUp).not.toBeCalled();
    expect(mockLoadAsync).not.toBeCalled();
  });

  test('upload with no file in zip', async () => {
    mockGetFileFromDialog.mockResolvedValue({
      arrayBuffer: () => Promise.resolve('arrayBuffer'),
    });
    mockLoadAsync.mockResolvedValue(mockJsZipInstance);
    mockJsZipInstance.filter.mockReturnValue([]);
    await uploadCameraData();
    expect(mockGetFileFromDialog).toBeCalledTimes(1);
    expect(mockOpenSteppingProgress).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledTimes(1);
    expect(mockUploadToDirectory).not.toBeCalled();
    expect(mockPopUpError).toBeCalledTimes(1);
    expect(mockPopUpError).toBeCalledWith({ message: 'incorrect_folder' });
  });
});
