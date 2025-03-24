import React, { memo, useContext, useEffect } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import moduleBoundaryDrawer from '@core/app/actions/canvas/module-boundary-drawer';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import alertConstants from '@core/app/constants/alert-constants';
import LayerModule, { modelsWithModules, printingModules } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import alertConfig from '@core/helpers/api/alert-config';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isDev from '@core/helpers/is-dev';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { applyPreset, baseConfig, getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerElementByName } from '@core/helpers/layer/layer-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './ModuleBlock.module.scss';

const ModuleBlock = (): React.ReactNode => {
  const isMobile = useIsMobile();
  const {
    alert: tAlert,
    beambox: {
      right_panel: { laser_panel: t },
    },
    layer_module: tModule,
  } = useI18n();
  const { initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { module } = state;
  const { value } = module;
  const workarea = useWorkarea();

  useEffect(() => {
    const handler = () => moduleBoundaryDrawer.update(value);

    handler();

    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

    canvasEvents.on('canvas-change', handler);

    return () => {
      canvasEvents.off('canvas-change', handler);
    };
  }, [workarea, value]);

  if (!modelsWithModules.has(workarea)) {
    return null;
  }

  const handleChange = async (newVal: number) => {
    const isCurrentPrinting = printingModules.has(value);
    const isNewPrinting = printingModules.has(newVal);

    if (isCurrentPrinting && !isNewPrinting && !alertConfig.read('skip-switch-to-printer-module')) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          caption: tModule.notification.convertFromPrintingModuleTitle,
          checkbox: {
            callbacks: [
              () => {
                alertConfig.write('skip-switch-to-printer-module', true);
                resolve(true);
              },
              () => resolve(false),
            ],
            text: tAlert.dont_show_again,
          },
          id: 'switch-to-printer-module',
          message: tModule.notification.convertFromPrintingModuleMsg,
          messageIcon: 'notice',
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
        });
      });

      if (!res) {
        return;
      }
    } else if (!isCurrentPrinting && isNewPrinting && !alertConfig.read('skip-switch-to-laser-module')) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          caption: tModule.notification.convertFromLaserModuleTitle,
          checkbox: {
            callbacks: [
              () => {
                alertConfig.write('skip-switch-to-laser-module', true);
                resolve(true);
              },
              () => resolve(false),
            ],
            text: tAlert.dont_show_again,
          },
          id: 'switch-to-laser-module',
          message: tModule.notification.convertFromLaserModuleMsg,
          messageIcon: 'notice',
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
        });
      });

      if (!res) {
        return;
      }
    }

    const presetsList = presetHelper.getPresetsList(workarea, value);
    const newPresetsList = presetHelper.getPresetsList(workarea, newVal);
    const batchCmd = new history.BatchCommand('Change layer module');

    selectedLayers.forEach((layerName) => {
      const layer = getLayerElementByName(layerName);

      writeDataLayer(layer, 'module', newVal, { batchCmd });

      const configName = getData(layer, 'configName');
      const oldPreset = configName ? presetsList.find((p) => configName === p.key || configName === p.name) : null;
      const newPreset = oldPreset ? newPresetsList.find((p) => configName === p.key || configName === p.name) : null;

      if (!newPreset) {
        writeDataLayer(layer, 'configName', undefined, { batchCmd });

        if (isCurrentPrinting && !isNewPrinting) {
          writeDataLayer(layer, 'speed', baseConfig.speed, { batchCmd });
          writeDataLayer(layer, 'power', baseConfig.power, { batchCmd });
        } else if (!isCurrentPrinting && isNewPrinting) {
          writeDataLayer(layer, 'printingSpeed', baseConfig.printingSpeed, { batchCmd });
          writeDataLayer(layer, 'ink', baseConfig.ink, { batchCmd });
          writeDataLayer(layer, 'multipass', baseConfig.multipass, { batchCmd });
        }
      } else if (newPreset !== oldPreset) {
        applyPreset(layer, newPreset, { batchCmd });
      }

      const toggleFullColorCmd = toggleFullColorLayer(layer, { val: isNewPrinting });

      if (toggleFullColorCmd && !toggleFullColorCmd.isEmpty()) batchCmd.addSubCommand(toggleFullColorCmd);
    });
    initState(selectedLayers);
    LayerPanelController.updateLayerPanel();
    presprayArea.togglePresprayArea();
    batchCmd.onAfter = () => {
      initState();
      LayerPanelController.updateLayerPanel();
      presprayArea.togglePresprayArea();
    };
    undoManager.addCommandToHistory(batchCmd);
  };

  const options = [
    { label: tModule.laser_10w_diode, value: LayerModule.LASER_10W_DIODE },
    { label: tModule.laser_20w_diode, value: LayerModule.LASER_20W_DIODE },
    { label: tModule.printing, value: LayerModule.PRINTER },
    isDev() && { label: `${tModule.printing} (4C)`, value: LayerModule.PRINTER_4C },
    { label: tModule.laser_2w_infrared, value: LayerModule.LASER_1064 },
  ].filter(Boolean);

  return isMobile ? (
    <ObjectPanelItem.Select
      id="module"
      label={t.module}
      onChange={handleChange}
      options={options}
      selected={options.find((option) => option.value === value)}
    />
  ) : (
    <div className={styles.panel}>
      <div className={styles.title}>{t.module}</div>
      <Select className={styles.select} onChange={handleChange} options={options} value={value as LayerModule} />
    </div>
  );
};

export default memo(ModuleBlock);
