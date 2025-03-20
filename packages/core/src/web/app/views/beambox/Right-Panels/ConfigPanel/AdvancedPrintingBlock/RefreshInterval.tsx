import React, { memo, useContext } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';
import Input from '../Input';

const RefreshIntervalBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const {
    refreshInterval: { hasMultiValue, value },
  } = state;

  const handleChange = (value: number) => {
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, refreshInterval: value },
      type: 'change',
    });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Refresh Interval');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'refreshInterval', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={0}
      id="refresh-interval"
      label="Refresh Interval"
      max={50}
      min={0}
      updateValue={handleChange}
      value={value}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>Refresh Interval</span>
      <Input
        hasMultiValue={hasMultiValue}
        id="refresh-interval"
        max={50}
        min={0}
        onChange={handleChange}
        precision={0}
        value={value}
      />
    </div>
  );
};

export default memo(RefreshIntervalBlock);
