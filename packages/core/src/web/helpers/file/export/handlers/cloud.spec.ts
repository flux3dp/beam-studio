const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

const mockSaveToCloudDialog = jest.fn();
const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  saveToCloud: (...args: any[]) => mockSaveToCloudDialog(...args),
  showLoginDialog: (...args: any[]) => mockShowLoginDialog(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args: any[]) => mockOpenNonstopProgress(...args),
  popById: (...args: any[]) => mockPopById(...args),
}));

const mockSetCloudUUID = jest.fn();
const mockSetFileName = jest.fn();
const mockSetHasUnsavedChanges = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  setCloudUUID: (...args: any[]) => mockSetCloudUUID(...args),
  setFileName: (...args: any[]) => mockSetFileName(...args),
  setHasUnsavedChanges: (...args: any[]) => mockSetHasUnsavedChanges(...args),
}));

const mockClearSelection = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  clearSelection: (...args: any[]) => mockClearSelection(...args),
}));

const mockRemoveUnusedDefs = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: any) =>
    cb({
      Canvas: {
        removeUnusedDefs: (...args: any[]) => mockRemoveUnusedDefs(...args),
      },
    }),
}));

const mockGenerateBeamBuffer = jest.fn();

jest.mock('../utils/beam', () => ({
  generateBeamBuffer: (...args: any[]) => mockGenerateBeamBuffer(...args),
}));

// flux-id resolves to the central __mocks__ file (all members are jest.fn()s).
import { axiosFluxId, getCurrentUser, getDefaultHeader } from '@core/helpers/api/flux-id';
import { useDocumentStore } from '@core/app/stores/documentStore';
// The central i18n mock resolves to the real en.ts; referencing keys from it pins
// "the right lang key was used" without breaking on copy edits.
import langEn from '@core/app/lang/en';

import { saveToCloud } from './cloud';

const mockPost = axiosFluxId.post as jest.Mock;
const mockPut = axiosFluxId.put as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockGetDefaultHeader = getDefaultHeader as jest.Mock;

const expectedRequestConfig = {
  headers: { 'X-CSRFToken': 'token' },
  timeout: 120000,
  withCredentials: true,
};

describe('saveToCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ email: 'test@flux3dp.com' });
    mockGetDefaultHeader.mockReturnValue({ 'X-CSRFToken': 'token' });
    mockOpenNonstopProgress.mockResolvedValue(undefined);
    mockGenerateBeamBuffer.mockResolvedValue([1, 2, 3]);
    useDocumentStore.setState({ workarea: 'ado1' });
  });

  test('requires login: shows login dialog and aborts without any request', async () => {
    mockGetCurrentUser.mockReturnValue(null);

    const result = await saveToCloud();

    expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockSaveToCloudDialog).not.toHaveBeenCalled();
  });

  test('save with uuid overwrites the same cloud file via PUT', async () => {
    mockPut.mockResolvedValueOnce({ data: { status: 'ok' }, status: 200 });

    const result = await saveToCloud('uuid-1');

    expect(mockPut).toHaveBeenCalledWith(
      '/api/beam-studio/cloud/file/uuid-1',
      expect.any(FormData),
      expectedRequestConfig,
    );
    expect(mockPost).not.toHaveBeenCalled();
    // Overwrite must NOT ask for a new file name (that is the save-as path).
    expect(mockSaveToCloudDialog).not.toHaveBeenCalled();

    const form = mockPut.mock.calls[0][1] as FormData;

    expect(form.get('workarea')).toBe('ado1');
    expect(form.get('file')).toBeInstanceOf(Blob);
    expect(form.get('type')).toBeNull();

    // No new_file in the response -> the current uuid stays.
    expect(mockSetCloudUUID).not.toHaveBeenCalled();
    expect(mockSetHasUnsavedChanges).toHaveBeenCalledWith(false, false);
    expect(result).toBe(true);
  });

  test('save without uuid asks for a name and POSTs a new file (save-as)', async () => {
    mockSaveToCloudDialog.mockResolvedValueOnce({ fileName: 'new-scene', isCancelled: false });
    mockPost.mockResolvedValueOnce({ data: { new_file: 'uuid-new', status: 'ok' }, status: 200 });

    const result = await saveToCloud();

    expect(mockSaveToCloudDialog).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/beam-studio/cloud/add/new-scene',
      expect.any(FormData),
      expectedRequestConfig,
    );
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockSetFileName).toHaveBeenCalledWith('new-scene');

    const form = mockPost.mock.calls[0][1] as FormData;

    expect(form.get('type')).toBe('file');
    expect(form.get('workarea')).toBe('ado1');

    // The newly created cloud uuid becomes the current file.
    expect(mockSetCloudUUID).toHaveBeenCalledWith('uuid-new');
    expect(mockSetHasUnsavedChanges).toHaveBeenCalledWith(false, false);
    expect(result).toBe(true);
  });

  test('cancelling the save-as name dialog aborts without a request', async () => {
    mockSaveToCloudDialog.mockResolvedValueOnce({ fileName: null, isCancelled: true });

    const result = await saveToCloud();

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockSetHasUnsavedChanges).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(mockPopById).toHaveBeenCalledWith('upload-cloud-file');
  });

  test('STORAGE_LIMIT_EXCEEDED (6th file over free quota) pops the quota error', async () => {
    mockSaveToCloudDialog.mockResolvedValueOnce({ fileName: 'sixth-file', isCancelled: false });
    mockPost.mockResolvedValueOnce({
      error: {
        response: {
          data: { info: 'STORAGE_LIMIT_EXCEEDED', message: 'limit reached' },
          status: 400,
          statusText: 'Bad Request',
        },
      },
    });

    const result = await saveToCloud();

    expect(mockPopUpError).toHaveBeenCalledWith({ message: langEn.my_cloud.save_file.storage_limit_exceeded });
    expect(mockSetHasUnsavedChanges).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(mockPopById).toHaveBeenCalledWith('upload-cloud-file');
  });

  test('403 CSRF failure prompts re-login', async () => {
    mockPut.mockResolvedValueOnce({
      error: {
        response: {
          data: { detail: 'CSRF Failed: CSRF token missing' },
          status: 403,
          statusText: 'Forbidden',
        },
      },
    });

    const result = await saveToCloud('uuid-1');

    expect(mockPopUp).toHaveBeenCalledTimes(1);

    const call = mockPopUp.mock.calls[0][0];

    expect(call.message).toBe(langEn.beambox.popup.ai_credit.relogin_to_use);
    call.onConfirm();
    expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  test('error without response surfaces connection_fail', async () => {
    mockPut.mockResolvedValueOnce({ error: {} });

    const result = await saveToCloud('uuid-1');

    expect(mockPopUpError).toHaveBeenCalledWith({ message: langEn.flux_id_login.connection_fail });
    expect(result).toBe(false);
  });

  test('other request errors surface caption + detail', async () => {
    mockPut.mockResolvedValueOnce({
      error: {
        response: {
          data: { detail: 'bad detail', info: 'SOME_INFO', message: 'some message' },
          status: 500,
          statusText: 'Internal Server Error',
        },
      },
    });

    const result = await saveToCloud('uuid-1');

    expect(mockPopUpError).toHaveBeenCalledWith({ caption: 'SOME_INFO', message: 'bad detail' });
    expect(result).toBe(false);
  });

  test('non-ok server status pops server error and returns false', async () => {
    mockPut.mockResolvedValueOnce({ data: { info: 'WEIRD', status: 'error' }, status: 200 });

    const result = await saveToCloud('uuid-1');

    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'Server Error: 200 WEIRD' });
    expect(mockSetHasUnsavedChanges).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test('thrown error surfaces save_to_cloud alert and closes progress', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateBeamBuffer.mockRejectedValueOnce(new Error('buffer fail'));

    const result = await saveToCloud('uuid-1');

    expect(mockPopUpError).toHaveBeenCalledWith({ message: `Error: ${langEn.topbar.menu.save_to_cloud}` });
    expect(result).toBe(false);
    expect(mockPopById).toHaveBeenCalledWith('upload-cloud-file');
  });
});
