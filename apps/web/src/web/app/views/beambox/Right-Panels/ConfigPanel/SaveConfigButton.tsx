import classNames from 'classnames';
import React, { memo, useContext } from 'react';

import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import ConfigPanelIcons from 'app/icons/config-panel/ConfigPanelIcons';
import dialogCaller from 'app/actions/dialog-caller';
import LayerModule from 'app/constants/layer-module/layer-modules';
import presetHelper from 'helpers/presets/preset-helper';
import useI18n from 'helpers/useI18n';
import { ConfigKey, Preset } from 'interfaces/ILayerConfig';
import { getConfigKeys, writeData } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './SaveConfigButton.module.scss';

const SaveConfigButton = (): JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;
  const { selectedLayers, state, dispatch } = useContext(ConfigPanelContext);
  const disabled = selectedLayers.length !== 1;

  const handleSave = (name: string) => {
    if (!name) return;
    const allConfigs = presetHelper.getAllPresets();
    if (allConfigs.find((config) => config.key === name || config.name === name)) {
      alertCaller.popUp({
        type: alertConstants.SHOW_POPUP_ERROR,
        message: lang.existing_name,
      });
      return;
    }
    const { module } = state;
    const keys = getConfigKeys(module.value);
    const newConfig: Preset = { name };
    if (module.value === LayerModule.PRINTER) newConfig.module = LayerModule.PRINTER;
    keys.forEach((key: ConfigKey) => {
      newConfig[key] = state[key].value as never;
    });
    presetHelper.savePreset(newConfig);
    selectedLayers.forEach((layerName) => writeData(layerName, 'configName', name));
    dispatch({ type: 'rename', payload: name });
  };

  return (
    <button
      type="button"
      className={classNames(styles.container, { [styles.disabled]: disabled })}
      onClick={() => {
        if (disabled) return;
        dialogCaller.promptDialog({
          caption: lang.dropdown.save,
          onYes: (name) => handleSave(name.trim()),
        });
      }}
    >
      <ConfigPanelIcons.Plus />
    </button>
  );
};

export default memo(SaveConfigButton);
