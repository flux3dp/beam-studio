import React, { memo, useContext, useEffect, useMemo } from 'react';

import { pipe } from 'remeda';

import alertCaller from '@core/app/actions/alert-caller';
import moduleBoundaryDrawer from '@core/app/actions/canvas/module-boundary-drawer';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import alertConfig from '@core/helpers/api/alert-config';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isDev from '@core/helpers/is-dev';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import {
  applyPreset,
  baseConfig,
  getData,
  moduleBaseConfig,
  writeDataLayer,
} from '@core/helpers/layer/layer-config-helper';
import { getLayerElementByName } from '@core/helpers/layer/layer-helper';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import ConfigPanelContext from './ConfigPanelContext';
import initState from './initState';
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
  const { module } = useConfigPanelStore();
  const { selectedLayers } = useContext(ConfigPanelContext);
  const { value } = module;
  const workarea = useWorkarea();
  const supportedModules = useMemo(() => getSupportedModules(workarea), [workarea]);

  useEffect(() => {
    moduleBoundaryDrawer.update();
  }, [value]);

  if (supportedModules.length <= 1) return null;

  const handleChange = async (newVal: LayerModuleType) => {
    const isCurrentPrinting = printingModules.has(value);
    const isChangingToPrinting = printingModules.has(newVal);

    if (isCurrentPrinting && !isChangingToPrinting && !alertConfig.read('skip-switch-to-printer-module')) {
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
    } else if (!isCurrentPrinting && isChangingToPrinting && !alertConfig.read('skip-switch-to-laser-module')) {
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

    const presetsList = presetHelper.getPresetsList(workarea, value as LayerModuleType);
    const newPresetsList = presetHelper.getPresetsList(workarea, newVal as LayerModuleType);
    const batchCmd = new history.BatchCommand('Change layer module');

    selectedLayers.forEach((layerName) => {
      const layer = getLayerElementByName(layerName);
      const configName = getData(layer, 'configName');
      const repeat = getData(layer, 'repeat');
      const oldPreset = configName ? presetsList.find(({ key, name }) => [key, name].includes(configName)) : null;
      const newPreset = oldPreset ? newPresetsList.find(({ key, name }) => [key, name].includes(configName)) : null;

      writeDataLayer(layer, 'module', newVal, { batchCmd });

      if (newVal === LayerModule.UV_PRINT) writeDataLayer(layer, 'repeat', 0, { batchCmd });
      else if (repeat === 0) writeDataLayer(layer, 'repeat', 1, { batchCmd });

      if (!newPreset) {
        writeDataLayer(layer, 'configName', undefined, { batchCmd });

        if (isCurrentPrinting && !isChangingToPrinting) {
          writeDataLayer(layer, 'speed', baseConfig.speed, { batchCmd });
          writeDataLayer(layer, 'power', baseConfig.power, { batchCmd });
        } else if (!isCurrentPrinting && isChangingToPrinting) {
          writeDataLayer(layer, 'printingSpeed', moduleBaseConfig[newVal]?.printingSpeed ?? baseConfig.printingSpeed, {
            batchCmd,
          });
          writeDataLayer(layer, 'ink', moduleBaseConfig[newVal]?.ink ?? baseConfig.ink, { batchCmd });
          writeDataLayer(layer, 'multipass', moduleBaseConfig[newVal]?.multipass ?? baseConfig.multipass, { batchCmd });
        }
      } else if (newPreset !== oldPreset) {
        applyPreset(layer, newPreset, { batchCmd });
      }

      const toggleFullColorCmd = toggleFullColorLayer(layer, { val: isChangingToPrinting });

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

  const options = pipe(
    supportedModules,
    (modules) => {
      const moduleTranslations = getModulesTranslations();

      return modules.map((value) => {
        const label = moduleTranslations[value] || tModule.unknown;

        if (!isDev() && value === LayerModule.PRINTER_4C) return null;

        return { label, value };
      });
    },
    (options) => options.filter(Boolean),
  );

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
      <Select className={styles.select} onChange={handleChange} options={options} value={value as LayerModuleType} />
    </div>
  );
};

export default memo(ModuleBlock);
