import React, { memo, useContext, useEffect } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithModules, modelsWithoutUvExport } from '@core/app/actions/beambox/constant';
import moduleBoundaryDrawer from '@core/app/actions/canvas/module-boundary-drawer';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import alertConstants from '@core/app/constants/alert-constants';
import { fullColorModules, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import alertConfig from '@core/helpers/api/alert-config';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { applyPreset, baseConfig, getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerElementByName } from '@core/helpers/layer/layer-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './ModuleBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

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

  if (modelsWithoutUvExport.has(workarea)) {
    return null;
  }

  const handleChange = async (newVal: number) => {
    if (
      value === LayerModule.PRINTER &&
      newVal !== LayerModule.PRINTER &&
      !alertConfig.read('skip-switch-to-printer-module')
    ) {
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
    } else if (
      value !== LayerModule.PRINTER &&
      newVal === LayerModule.PRINTER &&
      !alertConfig.read('skip-switch-to-laser-module')
    ) {
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
      const configName = getData(layer, 'configName');
      const repeat = getData(layer, 'repeat');
      const oldPreset = configName ? presetsList.find(({ key, name }) => [key, name].includes(configName)) : null;
      const newPreset = oldPreset ? newPresetsList.find(({ key, name }) => [key, name].includes(configName)) : null;

      writeDataLayer(layer, 'module', newVal, { batchCmd });

      if (newVal === LayerModule.UV_EXPORT) writeDataLayer(layer, 'repeat', 0, { batchCmd });
      else if (repeat === 0) writeDataLayer(layer, 'repeat', 1, { batchCmd });

      if (!newPreset) {
        writeDataLayer(layer, 'configName', undefined, { batchCmd });

        if (value === LayerModule.PRINTER && newVal !== LayerModule.PRINTER) {
          writeDataLayer(layer, 'speed', baseConfig.speed, { batchCmd });
          writeDataLayer(layer, 'power', baseConfig.power, { batchCmd });
        } else if (value !== LayerModule.PRINTER && newVal === LayerModule.PRINTER) {
          writeDataLayer(layer, 'printingSpeed', baseConfig.printingSpeed, { batchCmd });
          writeDataLayer(layer, 'ink', baseConfig.ink, { batchCmd });
          writeDataLayer(layer, 'multipass', baseConfig.multipass, { batchCmd });
        }
      } else if (newPreset !== oldPreset) {
        applyPreset(layer, newPreset, { batchCmd });
      }

      batchCmd.addSubCommand(toggleFullColorLayer(layer, { val: fullColorModules.has(newVal) }));
    });

    initState(selectedLayers);
    LayerPanelController.updateLayerPanel();
    presprayArea.togglePresprayArea();

    batchCmd.onAfter = () => {
      initState();
      LayerPanelController.updateLayerPanel();
      presprayArea.togglePresprayArea();
    };

    svgCanvas.addCommandToHistory(batchCmd);
  };

  const commonOptions = [{ label: 'UV Export', value: LayerModule.UV_EXPORT }];
  const defaultModelsOptions = [{ label: 'Laser', value: LayerModule.LASER_UNIVERSAL }];
  const adorOptions = [
    { label: tModule.laser_10w_diode, value: LayerModule.LASER_10W_DIODE },
    { label: tModule.laser_20w_diode, value: LayerModule.LASER_20W_DIODE },
    { label: tModule.printing, value: LayerModule.PRINTER },
    { label: tModule.laser_2w_infrared, value: LayerModule.LASER_1064 },
  ];

  const options = (modelsWithModules.has(workarea) ? adorOptions : defaultModelsOptions).concat(commonOptions);

  return isMobile ? (
    <ObjectPanelItem.Select
      id="module"
      label={t.module}
      onChange={handleChange as any}
      options={options}
      selected={options.find((option) => option.value === value) as { label: string; value: number }}
    />
  ) : (
    <div className={styles.panel}>
      <div className={styles.title}>{t.module}</div>
      <Select className={styles.select} onChange={handleChange} value={value as LayerModule}>
        {options.map(({ label, value }) => (
          <Select.Option key={value} value={value}>
            {label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default memo(ModuleBlock);
