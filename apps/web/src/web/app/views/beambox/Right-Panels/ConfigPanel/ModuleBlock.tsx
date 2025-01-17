import React, { memo, useContext, useEffect } from 'react';

import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import moduleBoundaryDrawer from 'app/actions/canvas/module-boundary-drawer';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import presetHelper from 'helpers/presets/preset-helper';
import presprayArea from 'app/actions/canvas/prespray-area';
import Select from 'app/widgets/AntdSelect';
import toggleFullColorLayer from 'helpers/layer/full-color/toggleFullColorLayer';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import {
  applyPreset,
  baseConfig,
  getData,
  writeDataLayer,
} from 'helpers/layer/layer-config-helper';
import { getLayerElementByName } from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './ModuleBlock.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const ModuleBlock = (): JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { selectedLayers, state, initState } = useContext(ConfigPanelContext);
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
  if (!modelsWithModules.has(workarea)) return null;

  const handleChange = async (newVal: number) => {
    if (
      value === LayerModule.PRINTER &&
      newVal !== LayerModule.PRINTER &&
      !alertConfig.read('skip-switch-to-printer-module')
    ) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          id: 'switch-to-printer-module',
          caption: lang.layer_module.notification.convertFromPrintingModuleTitle,
          message: lang.layer_module.notification.convertFromPrintingModuleMsg,
          messageIcon: 'notice',
          buttonType: alertConstants.CONFIRM_CANCEL,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          checkbox: {
            text: lang.beambox.popup.dont_show_again,
            callbacks: [
              () => {
                alertConfig.write('skip-switch-to-printer-module', true);
                resolve(true);
              },
              () => resolve(false),
            ],
          },
        });
      });
      if (!res) return;
    } else if (
      value !== LayerModule.PRINTER &&
      newVal === LayerModule.PRINTER &&
      !alertConfig.read('skip-switch-to-laser-module')
    ) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          id: 'switch-to-laser-module',
          caption: lang.layer_module.notification.convertFromLaserModuleTitle,
          message: lang.layer_module.notification.convertFromLaserModuleMsg,
          messageIcon: 'notice',
          buttonType: alertConstants.CONFIRM_CANCEL,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          checkbox: {
            text: lang.beambox.popup.dont_show_again,
            callbacks: [
              () => {
                alertConfig.write('skip-switch-to-laser-module', true);
                resolve(true);
              },
              () => resolve(false),
            ],
          },
        });
      });
      if (!res) return;
    }
    const presetsList = presetHelper.getPresetsList(workarea, value);
    const newPresetsList = presetHelper.getPresetsList(workarea, newVal);
    const batchCmd = new history.BatchCommand('Change layer module');
    selectedLayers.forEach((layerName) => {
      const layer = getLayerElementByName(layerName);
      writeDataLayer(layer, 'module', newVal, { batchCmd });
      const configName = getData(layer, 'configName');
      const oldPreset = configName
        ? presetsList.find((p) => configName === p.key || configName === p.name)
        : null;
      const newPreset = oldPreset
        ? newPresetsList.find((p) => configName === p.key || configName === p.name)
        : null;
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
      batchCmd.addSubCommand(toggleFullColorLayer(layer, { val: newVal === LayerModule.PRINTER }));
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

  const options = [
    { label: lang.layer_module.laser_10w_diode, value: LayerModule.LASER_10W_DIODE },
    { label: lang.layer_module.laser_20w_diode, value: LayerModule.LASER_20W_DIODE },
    { label: lang.layer_module.printing, value: LayerModule.PRINTER },
    { label: lang.layer_module.laser_2w_infrared, value: LayerModule.LASER_1064 },
  ];

  return isMobile ? (
    <ObjectPanelItem.Select
      id="module"
      selected={options.find((option) => option.value === value)}
      onChange={handleChange}
      options={options}
      label={t.module}
    />
  ) : (
    <div className={styles.panel}>
      <div className={styles.title}>{t.module}</div>
      <Select className={styles.select} onChange={handleChange} value={value as LayerModule}>
        {options.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default memo(ModuleBlock);
