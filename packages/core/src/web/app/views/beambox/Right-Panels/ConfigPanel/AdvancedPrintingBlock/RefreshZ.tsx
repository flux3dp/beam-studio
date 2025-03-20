import React, { memo, useContext } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';
import Input from '../Input';

const RefreshZBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const {
    refreshZ: { hasMultiValue, value },
  } = state;

  const handleChange = (value: number) => {
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, refreshZ: value },
      type: 'change',
    });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Refresh Interval');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'refreshZ', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={1}
      id="refresh-interval"
      label="Refresh Interval"
      max={50}
      min={0}
      unit="mm"
      updateValue={handleChange}
      value={value}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>Refresh Z</span>
      <Input
        hasMultiValue={hasMultiValue}
        id="refresh-interval"
        max={50}
        min={0}
        onChange={handleChange}
        precision={1}
        unit="mm"
        value={value}
      />
    </div>
  );
};

export default memo(RefreshZBlock);
