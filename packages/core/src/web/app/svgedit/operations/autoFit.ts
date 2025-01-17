/* eslint-disable @typescript-eslint/no-loop-func */
import alertCaller from 'app/actions/alert-caller';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import getUtilWS from 'helpers/api/utils-ws';
import i18n from 'helpers/i18n';
import previewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import progressCaller from 'app/actions/progress-caller';
import { AutoFitContour } from 'interfaces/IAutoFit';
import { showAutoFitPanel } from 'app/components/dialogs/autoFit';

const dataCache: { url: string; data?: AutoFitContour[][] } = { url: '' };

// TODO: add unit test
const autoFit = async (elem: SVGElement): Promise<void> => {
  const previewBackgroundUrl = previewModeBackgroundDrawer.getCameraCanvasUrl();
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
    const workarea = beamboxPreference.read('workarea');
    let data: AutoFitContour[][];
    if (dataCache.url === previewBackgroundUrl && dataCache.data) {
      data = dataCache.data;
    } else {
      data = await utilWS.getAllSimilarContours(blob, {
        isSplcingImg: !constant.adorModels.includes(workarea),
      });
      dataCache.url = previewBackgroundUrl;
      dataCache.data = data;
    }
    if (data.length === 0) {
      alertCaller.popUp({ message: lang.failed_to_find_contour });
      return;
    }
    showAutoFitPanel(elem, previewBackgroundUrl, data);
    return;
  } catch (error) {
    console.error(error);
    alertCaller.popUpError({ message: `Failed to auto fit.<br/>${error}` });
  } finally {
    progressCaller.popById('auto-fit');
  }
};

export default autoFit;
