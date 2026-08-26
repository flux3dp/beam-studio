import alertCaller from '@core/app/actions/alert-caller';
import { SettingCategory, showSettingsModal } from '@core/app/components/settings';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';

import { PRINT_AND_CUT_HIDDEN_ATTR } from '../constants';
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
  const t = i18n.lang.print_and_cut;

  if (!useGlobalPreferenceStore.getState()['enable-uv-print-file']) {
    alertCaller.popUp({
      buttonLabels: [i18n.lang.alert.cancel, t.open_preferences],
      callbacks: [() => {}, () => showSettingsModal(SettingCategory.EDITOR, 'set-enable-uv-print-file')],
      message: t.uv_print_file_disabled,
      primaryButtonIndex: 1,
    });

    return false;
  }

  // show the UV Print layers a previous Finish hid and tagged
  let unhidAny = false;

  layerManager.getAllLayers().forEach((layer) => {
    const group = layer.getGroup();

    if (!group.hasAttribute(PRINT_AND_CUT_HIDDEN_ATTR)) return;

    group.removeAttribute(PRINT_AND_CUT_HIDDEN_ATTR);
    layer.setVisible(true);
    unhidAny = true;
  });

  if (unhidAny) useLayerStore.getState().forceUpdate();

  const contents = collectCanvasContents();

  if (contents.elements.length === 0) {
    const hasUvPrintLayer = layerManager
      .getAllLayers()
      .some((layer) => getData(layer.getGroup(), 'module') === LayerModule.UV_PRINT);

    alertCaller.popUp({ message: hasUvPrintLayer ? t.no_content : t.no_uv_layer });

    return false;
  }

  clearRasterCache();
  usePrintAndCutStore.getState().init(contents);

  return true;
};
