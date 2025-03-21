import React, { memo, useContext } from 'react';

import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import { getConfigKeys, writeData } from '@core/helpers/layer/layer-config-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, Preset } from '@core/interfaces/ILayerConfig';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './SaveConfigButton.module.scss';

const SaveConfigButton = (): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;
  const { dispatch, selectedLayers, state } = useContext(ConfigPanelContext);
  const disabled = selectedLayers.length !== 1;

  const handleSave = (name: string) => {
    if (!name) {
      return;
    }

    const allConfigs = presetHelper.getAllPresets();

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

    if (printingModules.has(module.value)) {
      // TODO: should Printer & Printer_4C share configs?
      newConfig.module = module.value;
    }

    keys.forEach((key: ConfigKey) => {
      newConfig[key] = state[key].value as never;
    });
    presetHelper.savePreset(newConfig);
    selectedLayers.forEach((layerName) => writeData(layerName, 'configName', name));
    dispatch({ payload: name, type: 'rename' });
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
