import React, { memo } from 'react';

import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { getConfigKeys, writeData } from '@core/helpers/layer/layer-config-helper';
import { getAllPresets, savePreset } from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, Preset } from '@core/interfaces/ILayerConfig';

import styles from './SaveConfigButton.module.scss';

const SaveConfigButton = (): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;
  const { getState, rename } = useConfigPanelStore();
  const state = getState();
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const disabled = selectedLayers.length !== 1;

  const handleSave = (name: string) => {
    if (!name) {
      return;
    }

    const allConfigs = getAllPresets();

    if (allConfigs.find((config) => config.key === name || config.name === name)) {
      alertCaller.popUp({
        message: lang.existing_name,
        type: alertConstants.SHOW_POPUP_ERROR,
      });

      return;
    }

    const { module } = state;
    const keys = getConfigKeys(module.value);
    const newConfig: Preset = { name };

    if (printingModules.has(module.value)) newConfig.module = module.value;

    keys.forEach((key: ConfigKey) => {
      newConfig[key] = state[key].value as never;
    });
    savePreset(newConfig);
    selectedLayers.forEach((layerName) => writeData(layerName, 'configName', name));
    rename(name);
  };

  return (
    <button
      className={classNames(styles.container, { [styles.disabled]: disabled })}
      onClick={() => {
        if (disabled) {
          return;
        }

        dialogCaller.promptDialog({
          caption: lang.dropdown.save,
          onYes: (name) => handleSave(name?.trim() ?? ''),
        });
      }}
      type="button"
    >
      <ConfigPanelIcons.Plus />
    </button>
  );
};

export default memo(SaveConfigButton);
