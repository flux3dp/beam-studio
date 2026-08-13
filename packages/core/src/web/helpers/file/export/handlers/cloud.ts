import Alert from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import selectionManager from '@core/app/svgedit/selection';
import type { ResponseWithError } from '@core/helpers/api/flux-id';
import { axiosFluxId, getCurrentUser, getDefaultHeader } from '@core/helpers/api/flux-id';
import { withMemoryLog } from '@core/helpers/debug/memoryLog';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { generateBeamChunks, toBlobPart } from '../utils/beam';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const saveToCloud = async (uuid?: string): Promise<boolean> => {
  const { lang } = i18n;
  const id = 'upload-cloud-file';
  const user = getCurrentUser();

  if (!user) {
    dialogCaller.showLoginDialog();

    return false;
  }

  selectionManager.clearSelection();
  svgCanvas.removeUnusedDefs();
  await Progress.openNonstopProgress({ id });

  try {
    // Blob takes the pieces as they are, so the file never has to exist as one allocation; the
    // parts are views over the buffers rather than copies of them
    const blob = await withMemoryLog(
      'saveToCloud: generate blob',
      async () => new Blob((await generateBeamChunks()).map(toBlobPart)),
    );
    const form = new FormData();

    form.append('file', blob);
    form.append('workarea', useDocumentStore.getState().workarea);

    let resp: ResponseWithError;

    if (uuid) {
      resp = await axiosFluxId.put(`/api/beam-studio/cloud/file/${uuid}`, form, {
        headers: getDefaultHeader(),
        timeout: 120000,
        withCredentials: true,
      });
    } else {
      const { fileName, isCancelled } = await dialogCaller.saveToCloud();

      if (isCancelled || !fileName) {
        return false;
      }

      currentFileManager.setFileName(fileName);
      form.append('type', 'file');
      resp = await axiosFluxId.post(`/api/beam-studio/cloud/add/${fileName}`, form, {
        headers: getDefaultHeader(),
        timeout: 120000,
        withCredentials: true,
      });
    }

    const { data, error, status: respStatus } = resp;

    if (error) {
      if (!error.response) {
        Alert.popUpError({ message: lang.flux_id_login.connection_fail });

        return false;
      }

      const { status, statusText } = error.response;
      const { detail, info, message } = error.response.data || {};

      if (status === 403 && detail && detail.startsWith('CSRF Failed: CSRF')) {
        Alert.popUp({
          buttonType: AlertConstants.CONFIRM_CANCEL,
          message: lang.beambox.popup.ai_credit.relogin_to_use,
          onConfirm: dialogCaller.showLoginDialog,
        });

        return false;
      }

      if (info === 'STORAGE_LIMIT_EXCEEDED') {
        Alert.popUpError({ message: lang.my_cloud.save_file.storage_limit_exceeded });

        return false;
      }

      Alert.popUpError({ caption: info, message: detail || message || `${status}: ${statusText}` });

      return false;
    }

    const { info, new_file: newUuid, status } = data;

    if (status === 'ok') {
      if (newUuid) {
        currentFileManager.setCloudUUID(newUuid);
      }

      currentFileManager.setHasUnsavedChanges(false, false);

      return true;
    }

    Alert.popUpError({ message: `Server Error: ${respStatus} ${info}` });

    return false;
  } catch (error) {
    console.error(error);
    Alert.popUpError({ message: `Error: ${lang.topbar.menu.save_to_cloud}` });

    return false;
  } finally {
    Progress.popById(id);
  }
};
