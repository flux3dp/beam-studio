import React, { memo } from 'react';

import classNames from 'classnames';

import type { EngravingMode } from '@core/app/constants/innerEngraving';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import Select from '@core/app/widgets/AntdSelect';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './HalftoneBlock.module.scss';
import initState from './initState';

/**
 * Inner engraving: whether the 3D objects of the layer are dotted or engraved as slice contours.
 * Switching keeps every other value, frequency included; the two presets are how to change them.
 */
const EngravingModeBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const t = useI18n().inner_engraving_settings;
  const { change, stlMode } = useConfigPanelStore();
  // absent until the panel state is re-read after inner engraving turned on
  const { hasMultiValue = false, value = 'dot' } = stlMode ?? {};

  const handleChange = (newValue: EngravingMode) => {
    if (newValue === value && !hasMultiValue) return;

    change({ configName: CUSTOM_PRESET_CONSTANT, stlMode: newValue });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change engraving mode');

      useLayerStore.getState().selectedLayers.forEach((layerName) => {
        writeData(layerName, 'stlMode', newValue, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const options: Array<{ label: string; value: EngravingMode }> = [
    { label: t.mode_dot, value: 'dot' },
    { label: t.mode_line, value: 'line' },
  ];

  return type === 'panel-item' ? (
    <ObjectPanelItem.Select
      id="stl-mode"
      label={t.engraving_mode}
      onChange={handleChange}
      options={options}
      selected={hasMultiValue ? { label: '-', value: 'dot' } : options.find((option) => option.value === value)!}
    />
  ) : (
    <div className={classNames(styles.panel)}>
      <span className={styles.title}>{t.engraving_mode}</span>
      <Select
        className={styles['inline-select']}
        id="stl-mode"
        onChange={handleChange}
        options={options}
        value={hasMultiValue ? '-' : value}
      />
    </div>
  );
};

export default memo(EngravingModeBlock);
