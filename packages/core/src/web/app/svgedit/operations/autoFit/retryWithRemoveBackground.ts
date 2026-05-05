import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import getUtilWS from '@core/helpers/api/utils-ws';
import i18n from '@core/helpers/i18n';
import { removeImageBackground } from '@core/helpers/image-edit';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import { dataCache } from './dataCache';

const retryWithRemoveBackground = async (
  previewBackgroundUrl: string,
  isSplicingImg: boolean,
): Promise<null | { data: AutoFitContour[][]; imageUrl: string }> => {
  if (dataCache.url === previewBackgroundUrl && dataCache.removedBgData) {
    return { data: dataCache.removedBgData, imageUrl: dataCache.removedBgImageUrl! };
  }

  try {
    progressCaller.openNonstopProgress({ id: 'auto-fit-retry', message: i18n.lang.general.processing });

    const previewResp = await fetch(previewBackgroundUrl);
    const previewBlob = await previewResp.blob();
    const cleanedBlob = await removeImageBackground(previewBlob);

    if (!cleanedBlob) return null;

    const utilWS = getUtilWS();
    const newData = await utilWS.getAllSimilarContours(cleanedBlob, { isSplicingImg });

    if (newData.length === 0) {
      alertCaller.popUp({ message: i18n.lang.auto_fit.failed_to_find_contour });

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

export default retryWithRemoveBackground;
