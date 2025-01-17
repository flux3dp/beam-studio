import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import beamFileHelper from 'helpers/beam-file-helper';
import currentFileManager from 'app/svgedit/currentFileManager';
import dialog from 'implementations/dialog';
import dialogCaller from 'app/actions/dialog-caller';
import i18n from 'helpers/i18n';
import progressCaller from 'app/actions/progress-caller';
import { IFile } from 'interfaces/IMyCloud';
import { showFluxPlusWarning } from 'app/actions/dialog-controller';

import { axiosFluxId, getDefaultHeader, ResponseWithError } from './flux-id';

/**
 * @typedef {Object} CheckResponseResult
 * @property {boolean} res if the request is successful
 * @property {number} [status] status code of the response
 * @property {string} [info] info of the response (usually error code)
 * @property {string} [message] message of the response (usually error message)
 * @property {boolean} [shouldCloseModal] if the MyCloud dialog should be closed
 */
interface CheckResponseResult {
  res: boolean;
  status?: number;
  info?: string;
  message?: string;
  shouldCloseModal?: boolean;
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
    const { info, message, detail } = error.response.data || {};
    if (status === 403 && detail && detail.startsWith('CSRF Failed: CSRF')) {
      alertCaller.popUp({
        message: lang.beambox.popup.ai_credit.relogin_to_use,
        buttonType: alertConstants.CONFIRM_CANCEL,
        onConfirm: dialogCaller.showLoginDialog,
      });
      return { res: false, status: statusCode };
    }
    if (info === 'STORAGE_LIMIT_EXCEEDED') {
      alertCaller.popUpError({ message: lang.my_cloud.save_file.storage_limit_exceeded });
      return { res: false, info, message, status: statusCode };
    }
    const errorMessage = `${status}: ${[info, message, detail].filter(Boolean).join(' ')}`;
    alertCaller.popUpError({ message: errorMessage });
    return { res: false, info, message, status: statusCode };
  }
  let { data } = resp;
  if (data instanceof Blob && data.type === 'application/json') {
    data = JSON.parse(await data.text());
  }
  const { status, info, message } = data;
  if (status !== 'error') return { res: true };
  if (info === 'NOT_SUBSCRIBED') {
    showFluxPlusWarning();
    return { res: false, info, message, status: statusCode, shouldCloseModal: true };
  }
  alertCaller.popUpError({ caption: info, message });
  return { res: false, info, message, status: statusCode };
};

interface OperationResult<T = null> extends CheckResponseResult {
  data: T | null;
}

export const openFile = async (file: IFile): Promise<OperationResult<Blob>> => {
  const id = 'open-cloud-file';
  await progressCaller.openNonstopProgress({ id });
  try {
    const resp = await axiosFluxId.get(`/api/beam-studio/cloud/file/${file.uuid}`, {
      withCredentials: true,
      responseType: 'blob',
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
    return { res: false, data: null };
  } finally {
    progressCaller.popById(id);
  }
};

export const duplicateFile = async (
  uuid: string
): Promise<OperationResult<{ new_file: string }>> => {
  const id = 'duplicate-cloud-file';
  await progressCaller.openNonstopProgress({ id });
  try {
    const resp = await axiosFluxId.put(
      `/api/beam-studio/cloud/file/operation/${uuid}`,
      { method: 'duplicate' },
      { withCredentials: true, headers: getDefaultHeader() }
    );
    const checkRespResult = await checkResp(resp);
    return { ...checkRespResult, data: resp.data };
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.duplicate}` });
    return { res: false, data: null };
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
      withCredentials: true,
      responseType: 'blob',
    });
    const checkRespResult = await checkResp(resp);
    if (!checkRespResult.res) return;
    const content = resp.data;
    await dialog.writeFileDialog(
      () => content,
      langFile.save_scene,
      window.os === 'Linux' ? `${file.name}.beam` : file.name,
      [
        {
          name: window.os === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files,
          extensions: ['beam'],
        },
        {
          name: langFile.all_files,
          extensions: ['*'],
        },
      ]
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
        { method: 'rename', data: newName },
        { withCredentials: true, headers: getDefaultHeader() }
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
      return { res: false, data: null };
    } finally {
      progressCaller.popById(id);
    }
  }
  return { res: false, data: null };
};

export const deleteFile = async (uuid: string): Promise<OperationResult> => {
  const id = 'delete-cloud-file';
  await progressCaller.openNonstopProgress({ id });
  try {
    const resp = await axiosFluxId.delete(`/api/beam-studio/cloud/file/${uuid}`, {
      withCredentials: true,
      headers: getDefaultHeader(),
    });
    const checkRespResult = await checkResp(resp);
    if (
      checkRespResult.res &&
      currentFileManager.isCloudFile &&
      currentFileManager.getPath() === uuid
    ) {
      currentFileManager.setCloudUUID(null);
    }
    return { ...checkRespResult, data: null };
  } catch (e) {
    console.error(e);
    alertCaller.popUpError({ message: `Error: ${i18n.lang.my_cloud.action.delete}` });
    return { res: false, data: null };
  } finally {
    progressCaller.popById(id);
  }
};

export const list = async (): Promise<OperationResult<IFile[]>> => {
  try {
    const resp = await axiosFluxId.get('/api/beam-studio/cloud/list', { withCredentials: true });
    const checkRespResult = await checkResp(resp);
    if (checkRespResult.res) return { ...checkRespResult, data: resp.data.data.files };
    return { ...checkRespResult, data: [] };
  } catch (e) {
    console.error(e);
    return { res: false, data: [] };
  }
};

export default {
  checkResp,
  deleteFile,
  downloadFile,
  duplicateFile,
  openFile,
  renameFile,
  list,
};
