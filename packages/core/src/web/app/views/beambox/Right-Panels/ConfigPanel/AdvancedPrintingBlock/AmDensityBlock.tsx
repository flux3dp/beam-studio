import React, { memo, useContext } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';
import Input from '../Input';

const AMDensityBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const {
    amDensity: { hasMultiValue, value },
  } = state;

  const handleChange = (value: number) => {
    dispatch({
      payload: { amDensity: value, configName: CUSTOM_PRESET_CONSTANT },
      type: 'change',
    });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change AM Density');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'amDensity', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={1}
      id="am-density"
      label="AM Density"
      max={10}
      min={0.1}
      updateValue={handleChange}
      value={value}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>AM Density</span>
      <Input
        hasMultiValue={hasMultiValue}
        id="am-density"
        max={10}
        min={0.1}
        onChange={handleChange}
        precision={1}
        value={value}
      />
    </div>
  );
};

export default memo(AMDensityBlock);
