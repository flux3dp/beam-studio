import alertCaller from '@core/app/actions/alert-caller';
import { SettingCategory, showSettingsModal } from '@core/app/components/settings';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';

import { usePrintAndCutStore } from '../store';

import { collectCanvasContents } from './collectContents';
import { clearRasterCache } from './computeContourPathD';

/**
 * Start the flow from the beginning on the current canvas: collect the visible
 * design from the UV Print layers and enter the setup step. Used both when the
 * dialog opens without a saved configuration and by the resume screen's Start
 * Over.
 * @returns false when the flow cannot start (an alert telling the user how to
 * fix it is shown): the UV print file preference is off, there is no UV Print
 * layer, or the UV Print layers have no visible content
 */
export const startFreshRun = (): boolean => {
  const lang = i18n.lang.print_and_cut;

  if (!useGlobalPreferenceStore.getState()['enable-uv-print-file']) {
    alertCaller.popUp({
      buttonLabels: [i18n.lang.alert.cancel, lang.open_preferences],
      callbacks: [() => {}, () => showSettingsModal(SettingCategory.EDITOR, 'set-enable-uv-print-file')],
      message: lang.uv_print_file_disabled,
      primaryButtonIndex: 1,
    });

    return false;
  }

  const contents = collectCanvasContents();

  if (contents.elements.length === 0) {
    const hasUvPrintLayer = layerManager
      .getAllLayers()
      .some((layer) => getData(layer.getGroup(), 'module') === LayerModule.UV_PRINT);

    alertCaller.popUp({ message: hasUvPrintLayer ? lang.no_content : lang.no_uv_layer });

    return false;
  }

  clearRasterCache();
  usePrintAndCutStore.getState().init(contents);

  return true;
};
