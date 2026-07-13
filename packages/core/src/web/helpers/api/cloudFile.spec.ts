import type { IFile } from '@core/interfaces/IMyCloud';

const mockPopUpError = jest.fn();
const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoginDialog: (...args: any[]) => mockShowLoginDialog(...args),
}));

const mockShowFluxPlusWarning = jest.fn();

jest.mock('@core/app/actions/dialog-controller', () => ({
  showFluxPlusWarning: (...args: any[]) => mockShowFluxPlusWarning(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args: any[]) => mockOpenNonstopProgress(...args),
  popById: (...args: any[]) => mockPopById(...args),
}));

const mockSetCloudFile = jest.fn();
const mockSetFileName = jest.fn();
const mockSetCloudUUID = jest.fn();
const mockGetPath = jest.fn();
const mockIsCloudFile = jest.fn(() => false);

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  getPath: (...args: any[]) => mockGetPath(...args),
  get isCloudFile() {
    return mockIsCloudFile();
  },
  setCloudFile: (...args: any[]) => mockSetCloudFile(...args),
  setCloudUUID: (...args: any[]) => mockSetCloudUUID(...args),
  setFileName: (...args: any[]) => mockSetFileName(...args),
}));

const mockReadBeam = jest.fn();

jest.mock('@core/helpers/beam-file-helper', () => ({ readBeam: (...args: any[]) => mockReadBeam(...args) }));

const mockSetFileInAnotherTab = jest.fn();

jest.mock('@core/helpers/fileImportHelper', () => ({
  setFileInAnotherTab: (...args: any[]) => mockSetFileInAnotherTab(...args),
}));

const mockGetOS = jest.fn(() => 'MacOS');

jest.mock('@core/helpers/getOS', () => ({
  getOS: (...args: any[]) => mockGetOS(...args),
}));

const mockWriteFileDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  writeFileDialog: (...args: any[]) => mockWriteFileDialog(...args),
}));

// Transport: inline-mock flux-id to avoid pulling in the heavy real module chain
// (device-master -> p-queue ESM). This overrides the central __mocks__, which the
// unit-test skill (§Pattern 10) permits for API-transport tests.
const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockGetDefaultHeader = jest.fn(() => undefined);

jest.mock('./flux-id', () => ({
  axiosFluxId: {
    delete: (...args: any[]) => mockDelete(...args),
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
  getDefaultHeader: (...args: any[]) => mockGetDefaultHeader(...args),
}));

import {
  checkResp,
  deleteFile,
  downloadFile,
  duplicateFile,
  list,
  openFile,
  openFileInAnotherTab,
  renameFile,
} from './cloudFile';
// The central i18n mock resolves to the real en.ts, so referencing keys from it keeps
// assertions pinned to "the right lang key was used" without breaking on copy edits.
import langEn from '@core/app/lang/en';

const mockFile: IFile = {
  created_at: '2024-01-01',
  last_modified_at: '2024-01-02',
  name: 'my-scene',
  size: 1234,
  thumbnail_url: null,
  uuid: 'uuid-1',
  workarea: null,
};

describe('helpers/api/cloudFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCloudFile.mockReturnValue(false);
    mockGetDefaultHeader.mockReturnValue({ 'X-CSRFToken': 'token' });
    mockOpenNonstopProgress.mockResolvedValue(undefined);
  });

  describe('checkResp', () => {
    test('null response surfaces connection_fail error', async () => {
      const result = await checkResp(null as any);

      expect(mockPopUpError).toHaveBeenCalledWith({ message: langEn.flux_id_login.connection_fail });
      expect(result).toEqual({ res: false });
    });

    test('error without response surfaces connection_fail with status', async () => {
      const result = await checkResp({ error: {}, status: 500 } as any);

      expect(mockPopUpError).toHaveBeenCalledWith({ message: langEn.flux_id_login.connection_fail });
      expect(result).toEqual({ res: false, status: 500 });
    });

    test('403 CSRF failure prompts re-login', async () => {
      const result = await checkResp({
        error: {
          response: {
            data: { detail: 'CSRF Failed: CSRF token missing' },
            status: 403,
          },
        },
        status: 403,
      } as any);

      expect(mockPopUp).toHaveBeenCalledTimes(1);

      const call = mockPopUp.mock.calls[0][0];

      expect(call.message).toBe(langEn.beambox.popup.ai_credit.relogin_to_use);
      call.onConfirm();
      expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ res: false, status: 403 });
    });

    test('STORAGE_LIMIT_EXCEEDED surfaces storage_limit_exceeded error (5-file / quota branch)', async () => {
      const result = await checkResp({
        error: {
          response: {
            data: { info: 'STORAGE_LIMIT_EXCEEDED', message: 'too many' },
            status: 400,
          },
        },
        status: 400,
      } as any);

      expect(mockPopUpError).toHaveBeenCalledWith({
        message: langEn.my_cloud.save_file.storage_limit_exceeded,
      });
      expect(result).toEqual({ info: 'STORAGE_LIMIT_EXCEEDED', message: 'too many', res: false, status: 400 });
    });

    test('error response without data still reports status without crashing', async () => {
      // Pins the `error.response.data || {}` guard: dropping it would throw on destructure.
      const result = await checkResp({ error: { response: { status: 502 } }, status: 502 } as any);

      expect(mockPopUpError).toHaveBeenCalledWith({ message: '502: ' });
      expect(result).toEqual({ info: undefined, message: undefined, res: false, status: 502 });
    });

    test('generic error builds combined message', async () => {
      const result = await checkResp({
        error: {
          response: {
            data: { detail: 'bad detail', info: 'SOME_INFO', message: 'some message' },
            status: 500,
          },
        },
        status: 500,
      } as any);

      expect(mockPopUpError).toHaveBeenCalledWith({ message: '500: SOME_INFO some message bad detail' });
      expect(result).toEqual({ info: 'SOME_INFO', message: 'some message', res: false, status: 500 });
    });

    test('success data with non-error status returns res true', async () => {
      const result = await checkResp({ data: { status: 'ok' } } as any);

      expect(mockPopUpError).not.toHaveBeenCalled();
      expect(result).toEqual({ res: true });
    });

    test('data status error with NOT_SUBSCRIBED shows FluxPlus warning', async () => {
      const result = await checkResp({
        data: { info: 'NOT_SUBSCRIBED', message: 'subscribe', status: 'error' },
        status: 200,
      } as any);

      expect(mockShowFluxPlusWarning).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        info: 'NOT_SUBSCRIBED',
        message: 'subscribe',
        res: false,
        shouldCloseModal: true,
        status: 200,
      });
    });

    test('data status error with other info shows caption error', async () => {
      const result = await checkResp({
        data: { info: 'OTHER', message: 'boom', status: 'error' },
        status: 200,
      } as any);

      expect(mockPopUpError).toHaveBeenCalledWith({ caption: 'OTHER', message: 'boom' });
      expect(result).toEqual({ info: 'OTHER', message: 'boom', res: false, status: 200 });
    });

    test('parses JSON Blob data before checking status', async () => {
      const payload = JSON.stringify({ info: 'X', message: 'blob-msg', status: 'error' });
      const blob = new Blob([payload], { type: 'application/json' });

      // jsdom's Blob has no .text() implementation; stub it while keeping instanceof Blob.
      (blob as any).text = jest.fn().mockResolvedValue(payload);

      const result = await checkResp({ data: blob } as any);

      expect(mockPopUpError).toHaveBeenCalledWith({ caption: 'X', message: 'blob-msg' });
      expect(result).toEqual({ info: 'X', message: 'blob-msg', res: false, status: undefined });
    });
  });

  describe('openFile', () => {
    test('success reads beam, sets cloud file and returns data', async () => {
      const blobData = new Blob(['beam-content']);

      mockGet.mockResolvedValueOnce({ data: blobData, status: 200 });

      const result = await openFile(mockFile);

      expect(mockGet).toHaveBeenCalledWith('/api/beam-studio/cloud/file/uuid-1', {
        responseType: 'blob',
        timeout: 120000,
        withCredentials: true,
      });
      expect(mockReadBeam).toHaveBeenCalledWith(blobData);
      expect(mockSetCloudFile).toHaveBeenCalledWith(mockFile);
      expect(result.res).toBe(true);
      expect(result.data).toBe(blobData);
      expect(result.shouldCloseModal).toBe(true);
      expect(mockOpenNonstopProgress).toHaveBeenCalledWith({ id: 'open-cloud-file' });
      expect(mockPopById).toHaveBeenCalledWith('open-cloud-file');
    });

    test('failed checkResp does not read beam and shouldCloseModal false', async () => {
      mockGet.mockResolvedValueOnce({
        error: { response: { data: { info: 'OTHER', message: 'boom' }, status: 400 } },
        status: 400,
      });

      const result = await openFile(mockFile);

      expect(mockReadBeam).not.toHaveBeenCalled();
      expect(mockSetCloudFile).not.toHaveBeenCalled();
      expect(result.res).toBe(false);
      expect(result.shouldCloseModal).toBe(false);
    });

    test('thrown error surfaces alert and returns res false', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce(new Error('network'));

      const result = await openFile(mockFile);

      expect(mockPopUpError).toHaveBeenCalledWith({ message: `Error: ${langEn.my_cloud.action.open}` });
      expect(result).toEqual({ data: null, res: false });
      expect(mockPopById).toHaveBeenCalledWith('open-cloud-file');
    });
  });

  describe('openFileInAnotherTab', () => {
    test('delegates to setFileInAnotherTab and returns res true', async () => {
      const result = await openFileInAnotherTab(mockFile);

      expect(mockSetFileInAnotherTab).toHaveBeenCalledWith({ file: mockFile, type: 'cloud' });
      expect(result).toEqual({ data: null, res: true });
    });
  });

  describe('duplicateFile', () => {
    test('puts duplicate operation with headers and returns data', async () => {
      mockPut.mockResolvedValueOnce({ data: { new_file: 'uuid-2', status: 'ok' }, status: 200 });

      const result = await duplicateFile('uuid-1');

      expect(mockPut).toHaveBeenCalledWith(
        '/api/beam-studio/cloud/file/operation/uuid-1',
        { method: 'duplicate' },
        { headers: { 'X-CSRFToken': 'token' }, withCredentials: true },
      );
      expect(result.res).toBe(true);
      expect(result.data).toEqual({ new_file: 'uuid-2', status: 'ok' });
      expect(mockPopById).toHaveBeenCalledWith('duplicate-cloud-file');
    });

    test('thrown error surfaces alert', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPut.mockRejectedValueOnce(new Error('fail'));

      const result = await duplicateFile('uuid-1');

      expect(mockPopUpError).toHaveBeenCalledWith({ message: `Error: ${langEn.my_cloud.action.duplicate}` });
      expect(result).toEqual({ data: null, res: false });
    });
  });

  describe('downloadFile', () => {
    test('success writes file dialog with beam extension (MacOS naming)', async () => {
      mockGetOS.mockReturnValue('MacOS');

      const content = new Blob(['data']);

      mockGet.mockResolvedValueOnce({ data: content, status: 200 });

      await downloadFile(mockFile);

      expect(mockGet).toHaveBeenCalledWith('/api/beam-studio/cloud/file/uuid-1', {
        responseType: 'blob',
        timeout: 120000,
        withCredentials: true,
      });
      expect(mockWriteFileDialog).toHaveBeenCalledTimes(1);

      const [getContent, , defaultName, filters] = mockWriteFileDialog.mock.calls[0];

      expect(getContent()).toBe(content);
      expect(defaultName).toBe('my-scene');
      expect(filters[0].extensions).toEqual(['beam']);
      expect(filters[0].name).toContain('*.beam');
      expect(mockPopById).toHaveBeenCalledWith('download-cloud-file');
    });

    test('Linux appends .beam to default file name', async () => {
      mockGetOS.mockReturnValue('Linux');
      mockGet.mockResolvedValueOnce({ data: new Blob(['data']), status: 200 });

      await downloadFile(mockFile);

      const [, , defaultName] = mockWriteFileDialog.mock.calls[0];

      expect(defaultName).toBe('my-scene.beam');
    });

    test('failed checkResp returns early without dialog', async () => {
      mockGet.mockResolvedValueOnce({
        error: { response: { data: { info: 'OTHER', message: 'boom' }, status: 400 } },
        status: 400,
      });

      await downloadFile(mockFile);

      expect(mockWriteFileDialog).not.toHaveBeenCalled();
      expect(mockPopById).toHaveBeenCalledWith('download-cloud-file');
    });

    test('thrown error surfaces alert', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce(new Error('fail'));

      await downloadFile(mockFile);

      expect(mockPopUpError).toHaveBeenCalledWith({ message: `Error: ${langEn.my_cloud.action.download}` });
    });
  });

  describe('renameFile', () => {
    test('empty new name short-circuits without request', async () => {
      const result = await renameFile('uuid-1', '');

      expect(mockPut).not.toHaveBeenCalled();
      expect(mockOpenNonstopProgress).not.toHaveBeenCalled();
      expect(result).toEqual({ data: null, res: false });
    });

    test('success updates current file name when it is the open cloud file', async () => {
      mockIsCloudFile.mockReturnValue(true);
      mockGetPath.mockReturnValue('uuid-1');
      mockPut.mockResolvedValueOnce({ data: { status: 'ok' }, status: 200 });

      const result = await renameFile('uuid-1', 'new-name');

      expect(mockPut).toHaveBeenCalledWith(
        '/api/beam-studio/cloud/file/operation/uuid-1',
        { data: 'new-name', method: 'rename' },
        { headers: { 'X-CSRFToken': 'token' }, withCredentials: true },
      );
      expect(mockSetFileName).toHaveBeenCalledWith('new-name');
      expect(result.res).toBe(true);
    });

    test('success does not rename current file when path differs', async () => {
      mockIsCloudFile.mockReturnValue(true);
      mockGetPath.mockReturnValue('other-uuid');
      mockPut.mockResolvedValueOnce({ data: { status: 'ok' }, status: 200 });

      await renameFile('uuid-1', 'new-name');

      expect(mockSetFileName).not.toHaveBeenCalled();
    });

    test('thrown error surfaces alert', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPut.mockRejectedValueOnce(new Error('fail'));

      const result = await renameFile('uuid-1', 'new-name');

      expect(mockPopUpError).toHaveBeenCalledWith({ message: `Error: ${langEn.my_cloud.action.rename}` });
      expect(result).toEqual({ data: null, res: false });
    });
  });

  describe('deleteFile', () => {
    test('success deletes and clears cloud uuid for the open file', async () => {
      mockIsCloudFile.mockReturnValue(true);
      mockGetPath.mockReturnValue('uuid-1');
      mockDelete.mockResolvedValueOnce({ data: { status: 'ok' }, status: 200 });

      const result = await deleteFile('uuid-1');

      expect(mockDelete).toHaveBeenCalledWith('/api/beam-studio/cloud/file/uuid-1', {
        headers: { 'X-CSRFToken': 'token' },
        withCredentials: true,
      });
      expect(mockSetCloudUUID).toHaveBeenCalledWith(null);
      expect(result.res).toBe(true);
      expect(mockPopById).toHaveBeenCalledWith('delete-cloud-file');
    });

    test('does not clear cloud uuid when deleting a different file', async () => {
      mockIsCloudFile.mockReturnValue(true);
      mockGetPath.mockReturnValue('other-uuid');
      mockDelete.mockResolvedValueOnce({ data: { status: 'ok' }, status: 200 });

      await deleteFile('uuid-1');

      expect(mockSetCloudUUID).not.toHaveBeenCalled();
    });

    test('thrown error surfaces alert', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockDelete.mockRejectedValueOnce(new Error('fail'));

      const result = await deleteFile('uuid-1');

      expect(mockPopUpError).toHaveBeenCalledWith({ message: `Error: ${langEn.my_cloud.action.delete}` });
      expect(result).toEqual({ data: null, res: false });
    });
  });

  describe('list', () => {
    test('success returns files array', async () => {
      const files = [mockFile];

      mockGet.mockResolvedValueOnce({ data: { data: { files }, status: 'ok' }, status: 200 });

      const result = await list();

      expect(mockGet).toHaveBeenCalledWith('/api/beam-studio/cloud/list', { withCredentials: true });
      expect(result.res).toBe(true);
      expect(result.data).toBe(files);
    });

    test('failed checkResp returns empty array', async () => {
      mockGet.mockResolvedValueOnce({
        error: { response: { data: { info: 'OTHER', message: 'boom' }, status: 400 } },
        status: 400,
      });

      const result = await list();

      expect(result.res).toBe(false);
      expect(result.data).toEqual([]);
    });

    test('thrown error returns empty array with res false', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce(new Error('fail'));

      const result = await list();

      expect(result).toEqual({ data: [], res: false });
    });
  });
});
