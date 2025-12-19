import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import { showFluxPlusWarning } from '@core/app/actions/dialog-controller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import beamFileHelper from '@core/helpers/beam-file-helper';
import { setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import dialog from '@core/implementations/dialog';
import type { IFile } from '@core/interfaces/IMyCloud';

import type { ResponseWithError } from './flux-id';
import { axiosFluxId, getDefaultHeader } from './flux-id';

/**
 * @typedef {Object} CheckResponseResult
 * @property {boolean} res if the request is successful
 * @property {number} [status] status code of the response
 * @property {string} [info] info of the response (usually error code)
 * @property {string} [message] message of the response (usually error message)
 * @property {boolean} [shouldCloseModal] if the MyCloud dialog should be closed
 */
interface CheckResponseResult {
  info?: string;
  message?: string;
  res: boolean;
  shouldCloseModal?: boolean;
  status?: number;
}

export const checkResp = async (resp: ResponseWithError): Promise<CheckResponseResult> => {
  const { lang } = i18n;

  if (!resp) {
    alertCaller.popUpError({ message: lang.flux_id_login.connection_fail });

    return { res: false };
  }

  const { error, status: statusCode } = resp;

  if (error) {
    if (!error.response) {
      alertCaller.popUpError({ message: lang.flux_id_login.connection_fail });

      return { res: false, status: statusCode };
    }

    const { status } = error.response;
    const { detail, info, message } = error.response.data || {};

    if (status === 403 && detail && detail.startsWith('CSRF Failed: CSRF')) {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        message: lang.beambox.popup.ai_credit.relogin_to_use,
        onConfirm: dialogCaller.showLoginDialog,
      });

      return { res: false, status: statusCode };
    }

    if (info === 'STORAGE_LIMIT_EXCEEDED') {
      alertCaller.popUpError({ message: lang.my_cloud.save_file.storage_limit_exceeded });

      return { info, message, res: false, status: statusCode };
    }

    const errorMessage = `${status}: ${[info, message, detail].filter(Boolean).join(' ')}`;

    alertCaller.popUpError({ message: errorMessage });

    return { info, message, res: false, status: statusCode };
  }

  let { data } = resp;

  if (data instanceof Blob && data.type === 'application/json') {
    data = JSON.parse(await data.text());
  }

  const { info, message, status } = data;

  if (status !== 'error') {
    return { res: true };
  }

  if (info === 'NOT_SUBSCRIBED') {
    showFluxPlusWarning();

    return { info, message, res: false, shouldCloseModal: true, status: statusCode };
  }

  alertCaller.popUpError({ caption: info, message });

  return { info, message, res: false, status: statusCode };
};

interface OperationResult<T = null> extends CheckResponseResult {
  data: null | T;
}

export const openFile = async (file: IFile): Promise<OperationResult<Blob>> => {
  const id = 'open-cloud-file';

  await progressCaller.openNonstopProgress({ id });
  try {
    const resp = await axiosFluxId.get(`/api/beam-studio/cloud/file/${file.uuid}`, {
      responseType: 'blob',
      timeout: 120000,
      withCredentials: true,
    });
    const checkRespResult = await checkResp(resp);

    if (checkRespResult.res) {
      await beamFileHelper.readBeam(resp.data);
      currentFileManager.setCloudFile(file);
    }

    return { ...checkRespResult, data: resp.data, shouldCloseModal: checkRespResult.res };
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.open}` });

    return { data: null, res: false };
  } finally {
    progressCaller.popById(id);
  }
};

export const openFileInAnotherTab = async (file: IFile): Promise<OperationResult<null>> => {
  setFileInAnotherTab({ file, type: 'cloud' });

  return { data: null, res: true };
};

export const duplicateFile = async (uuid: string): Promise<OperationResult<{ new_file: string }>> => {
  const id = 'duplicate-cloud-file';

  await progressCaller.openNonstopProgress({ id });
  try {
    const resp = await axiosFluxId.put(
      `/api/beam-studio/cloud/file/operation/${uuid}`,
      { method: 'duplicate' },
      { headers: getDefaultHeader(), withCredentials: true },
    );
    const checkRespResult = await checkResp(resp);

    return { ...checkRespResult, data: resp.data };
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.duplicate}` });

    return { data: null, res: false };
  } finally {
    progressCaller.popById(id);
  }
};

export const downloadFile = async (file: IFile): Promise<void> => {
  const id = 'download-cloud-file';

  await progressCaller.openNonstopProgress({ id });

  const langFile = i18n.lang.topmenu.file;

  try {
    const resp = await axiosFluxId.get(`/api/beam-studio/cloud/file/${file.uuid}`, {
      responseType: 'blob',
      timeout: 120000,
      withCredentials: true,
    });
    const checkRespResult = await checkResp(resp);

    if (!checkRespResult.res) {
      return;
    }

    const content = resp.data;
    const osName = getOS();

    await dialog.writeFileDialog(
      () => content,
      langFile.save_scene,
      osName === 'Linux' ? `${file.name}.beam` : file.name,
      [
        {
          extensions: ['beam'],
          name: osName === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files,
        },
        {
          extensions: ['*'],
          name: langFile.all_files,
        },
      ],
    );
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.download}` });
  } finally {
    progressCaller.popById(id);
  }
};

export const renameFile = async (uuid: string, newName: string): Promise<OperationResult> => {
  const id = 'rename-cloud-file';

  if (newName) {
    await progressCaller.openNonstopProgress({ id });
    try {
      const resp = await axiosFluxId.put(
        `/api/beam-studio/cloud/file/operation/${uuid}`,
        { data: newName, method: 'rename' },
        { headers: getDefaultHeader(), withCredentials: true },
      );
      const checkRespResult = await checkResp(resp);

      if (checkRespResult.res) {
        if (currentFileManager.isCloudFile && currentFileManager.getPath() === uuid) {
          currentFileManager.setFileName(newName);
        }
      }

      return { ...checkRespResult, data: null };
    } catch (e) {
      console.error(e);
      alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.rename}` });

      return { data: null, res: false };
    } finally {
      progressCaller.popById(id);
    }
  }

  return { data: null, res: false };
};

export const deleteFile = async (uuid: string): Promise<OperationResult> => {
  const id = 'delete-cloud-file';

  await progressCaller.openNonstopProgress({ id });
  try {
    const resp = await axiosFluxId.delete(`/api/beam-studio/cloud/file/${uuid}`, {
      headers: getDefaultHeader(),
      withCredentials: true,
    });
    const checkRespResult = await checkResp(resp);

    if (checkRespResult.res && currentFileManager.isCloudFile && currentFileManager.getPath() === uuid) {
      currentFileManager.setCloudUUID(null);
    }

    return { ...checkRespResult, data: null };
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.delete}` });

    return { data: null, res: false };
  } finally {
    progressCaller.popById(id);
  }
};

export const list = async (): Promise<OperationResult<IFile[]>> => {
  try {
    const resp = await axiosFluxId.get('/api/beam-studio/cloud/list', { withCredentials: true });
    const checkRespResult = await checkResp(resp);

    if (checkRespResult.res) {
      return { ...checkRespResult, data: resp.data.data.files };
    }

    return { ...checkRespResult, data: [] };
  } catch (e) {
    console.error(e);

    return { data: [], res: false };
  }
};

export default {
  checkResp,
  deleteFile,
  downloadFile,
  duplicateFile,
  list,
  openFile,
  openFileInAnotherTab,
  renameFile,
};
