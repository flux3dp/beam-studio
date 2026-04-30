import alertCaller from '@core/app/actions/alert-caller';
import constant from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import progressCaller from '@core/app/actions/progress-caller';
import { showAutoFitPanel } from '@core/app/components/dialogs/autoFit';
import getUtilWS from '@core/helpers/api/utils-ws';
import i18n from '@core/helpers/i18n';
import { removeImageBackground } from '@core/helpers/image-edit';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import workareaManager from '../workarea';

let dataCache: {
  data?: AutoFitContour[][];
  removedBgData?: AutoFitContour[][];
  removedBgImageUrl?: string;
  url: string;
} = { url: '' };

// TODO: add unit test
const autoFit = async (elem: SVGElement): Promise<void> => {
  const previewBackgroundUrl = await previewModeBackgroundDrawer.getCameraCanvasUrl();
  const lang = i18n.lang.auto_fit;

  if (!previewBackgroundUrl) {
    alertCaller.popUp({ message: lang.preview_first });

    return;
  }

  progressCaller.openNonstopProgress({ id: 'auto-fit', message: i18n.lang.general.processing });
  try {
    const utilWS = getUtilWS();
    const resp = await fetch(previewBackgroundUrl);
    const blob = await resp.blob();
    const isSplicingImg = !constant.adorModels.includes(workareaManager.model);
    let data: AutoFitContour[][];

    if (dataCache.url === previewBackgroundUrl && dataCache.data) {
      data = dataCache.data;
    } else {
      data = await utilWS.getAllSimilarContours(blob, { isSplicingImg });
      dataCache = { data, url: previewBackgroundUrl };
    }

    if (data.length === 0) {
      alertCaller.popUp({ message: lang.failed_to_find_contour });

      return;
    }

    const onRetryWithRemoveBackground = async (): Promise<null | {
      data: AutoFitContour[][];
      imageUrl: string;
    }> => {
      if (dataCache.url === previewBackgroundUrl && dataCache.removedBgData) {
        return { data: dataCache.removedBgData, imageUrl: dataCache.removedBgImageUrl! };
      }

      try {
        progressCaller.openNonstopProgress({ id: 'auto-fit-retry', message: i18n.lang.general.processing });

        const previewResp = await fetch(previewBackgroundUrl);
        const previewBlob = await previewResp.blob();
        const cleanedBlob = await removeImageBackground(previewBlob);

        if (!cleanedBlob) return null;

        const newData = await utilWS.getAllSimilarContours(cleanedBlob, { isSplicingImg });

        if (newData.length === 0) {
          alertCaller.popUp({ message: lang.failed_to_find_contour });

          return null;
        }

        const newImageUrl = URL.createObjectURL(cleanedBlob);

        dataCache.removedBgData = newData;
        dataCache.removedBgImageUrl = newImageUrl;

        return { data: newData, imageUrl: newImageUrl };
      } finally {
        progressCaller.popById('auto-fit-retry');
      }
    };

    showAutoFitPanel(elem, previewBackgroundUrl, data, onRetryWithRemoveBackground);

    return;
  } catch (error) {
    console.error(error);
    alertCaller.popUpError({ message: `Failed to auto fit.<br/>${error}` });
  } finally {
    progressCaller.popById('auto-fit');
  }
};

export default autoFit;
