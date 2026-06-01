import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import alertConfig from '@core/helpers/api/alert-config';
import getUtilWS from '@core/helpers/api/utils-ws';
import i18n from '@core/helpers/i18n';
import { removeImageBackground } from '@core/helpers/image-edit';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import { dataCache, setDataCache } from './dataCache';

const retryWithRemoveBackground = async (
  previewBackgroundUrl: string,
  isSplicingImg: boolean,
): Promise<null | { data: AutoFitContour[][]; imageUrl: string }> => {
  if (dataCache.url === previewBackgroundUrl && dataCache.removedBgData) {
    return { data: dataCache.removedBgData, imageUrl: dataCache.removedBgImageUrl! };
  }

  try {
    if (!alertConfig.read('skip_auto_fit_bg_removal_warning')) {
      const res = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          checkbox: {
            callbacks: [
              () => {
                alertConfig.write('skip_auto_fit_bg_removal_warning', true);
                resolve(true);
              },
              () => resolve(false),
            ],
            text: i18n.lang.alert.dont_show_again,
          },
          message: i18n.lang.auto_fit.warning_bg_removal,
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
        });
      });

      if (!res) return null;
    }

    progressCaller.openNonstopProgress({ id: 'auto-fit-retry', message: i18n.lang.general.processing });

    const previewResp = await fetch(previewBackgroundUrl);
    const previewBlob = await previewResp.blob();
    const cleanedBlob = await removeImageBackground(previewBlob, { showAlert: false });

    if (!cleanedBlob) return null;

    const utilWS = getUtilWS();
    const newData = await utilWS.getAllSimilarContours(cleanedBlob, { isSplicingImg });

    if (newData.length === 0) {
      alertCaller.popUp({ message: i18n.lang.auto_fit.failed_to_find_contour });

      return null;
    }

    const newImageUrl = URL.createObjectURL(cleanedBlob);

    setDataCache({ ...dataCache, removedBgData: newData, removedBgImageUrl: newImageUrl });

    return { data: newData, imageUrl: newImageUrl };
  } finally {
    progressCaller.popById('auto-fit-retry');
  }
};

export default retryWithRemoveBackground;
