import alertCaller from '@core/app/actions/alert-caller';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import initLayerConfigState from '@core/app/views/beambox/Right-Panels/ConfigPanel/initState';
import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import {
  applyPreset,
  baseConfig,
  getData,
  moduleBaseConfig,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import presetHelper from '@core/helpers/presets/preset-helper';

export const changeLayersModule = async (
  layers: Element[],
  oldValue: LayerModuleType,
  newValue: LayerModuleType,
  { addToHistory = false }: { addToHistory?: boolean } = {},
): Promise<boolean> => {
  const workarea = useDocumentStore.getState().workarea;
  const isCurrentPrinting = printingModules.has(oldValue);
  const isChangingToPrinting = printingModules.has(newValue);

  if (isCurrentPrinting && !isChangingToPrinting && !alertConfig.read('skip-switch-to-printer-module')) {
    const res = await new Promise((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: i18n.lang.layer_module.notification.convertFromPrintingModuleTitle,
        checkbox: {
          callbacks: [
            () => {
              alertConfig.write('skip-switch-to-printer-module', true);
              resolve(true);
            },
            () => resolve(false),
          ],
          text: i18n.lang.alert.dont_show_again,
        },
        id: 'switch-to-printer-module',
        message: i18n.lang.layer_module.notification.convertFromPrintingModuleMsg,
        messageIcon: 'notice',
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (!res) {
      return false;
    }
  } else if (!isCurrentPrinting && isChangingToPrinting && !alertConfig.read('skip-switch-to-laser-module')) {
    const res = await new Promise((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: i18n.lang.layer_module.notification.convertFromLaserModuleTitle,
        checkbox: {
          callbacks: [
            () => {
              alertConfig.write('skip-switch-to-laser-module', true);
              resolve(true);
            },
            () => resolve(false),
          ],
          text: i18n.lang.alert.dont_show_again,
        },
        id: 'switch-to-laser-module',
        message: i18n.lang.layer_module.notification.convertFromLaserModuleMsg,
        messageIcon: 'notice',
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (!res) {
      return false;
    }
  }

  const presetsList = presetHelper.getPresetsList(workarea, oldValue);
  const newPresetsList = presetHelper.getPresetsList(workarea, newValue);
  const batchCmd = new history.BatchCommand('Change layer module');
  const isBM2IR = workarea === 'fbm2' && newValue === LayerModule.LASER_1064;

  layers.forEach((layer) => {
    const configName = getData(layer, 'configName');
    const repeat = getData(layer, 'repeat');
    const oldPreset = configName ? presetsList.find(({ key, name }) => [key, name].includes(configName)) : null;
    const newPreset = oldPreset ? newPresetsList.find(({ key, name }) => [key, name].includes(configName)) : null;

    writeDataLayer(layer, 'module', newValue, { batchCmd });

    if (newValue === LayerModule.UV_PRINT) writeDataLayer(layer, 'repeat', 0, { batchCmd });
    else if (repeat === 0) writeDataLayer(layer, 'repeat', 1, { batchCmd });

    if (!newPreset) {
      writeDataLayer(layer, 'configName', undefined, { batchCmd });

      if (isCurrentPrinting && !isChangingToPrinting) {
        writeDataLayer(layer, 'speed', baseConfig.speed, { batchCmd });
        writeDataLayer(layer, 'power', baseConfig.power, { batchCmd });
      } else if (!isCurrentPrinting && isChangingToPrinting) {
        writeDataLayer(layer, 'printingSpeed', moduleBaseConfig[newValue]?.printingSpeed ?? baseConfig.printingSpeed, {
          batchCmd,
        });
        writeDataLayer(layer, 'ink', moduleBaseConfig[newValue]?.ink ?? baseConfig.ink, { batchCmd });
        writeDataLayer(layer, 'multipass', moduleBaseConfig[newValue]?.multipass ?? baseConfig.multipass, { batchCmd });
      } else if (isBM2IR) {
        const currentSpeed = getData(layer, 'speed');

        if (currentSpeed && currentSpeed > 150) writeDataLayer(layer, 'speed', 150, { batchCmd });
      }
    } else if (newPreset !== oldPreset) {
      applyPreset(layer, newPreset, { batchCmd });
    }

    const toggleFullColorCmd = toggleFullColorLayer(layer, { val: isChangingToPrinting });

    if (toggleFullColorCmd && !toggleFullColorCmd.isEmpty()) batchCmd.addSubCommand(toggleFullColorCmd);
  });

  initLayerConfigState();
  useLayerStore.getState().forceUpdate();
  presprayArea.togglePresprayArea();

  if (addToHistory) {
    batchCmd.onAfter = () => {
      initLayerConfigState();
      useLayerStore.getState().forceUpdate();
      presprayArea.togglePresprayArea();
    };
    undoManager.addCommandToHistory(batchCmd);
  }

  return true;
};
