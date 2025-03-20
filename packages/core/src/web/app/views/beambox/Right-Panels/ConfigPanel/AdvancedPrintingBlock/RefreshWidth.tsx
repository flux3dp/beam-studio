import React, { memo, useContext } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';
import Input from '../Input';

const RefreshWidthBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const {
    refreshWidth: { hasMultiValue, value },
  } = state;

  const handleChange = (value: number) => {
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, refreshWidth: value },
      type: 'change',
    });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Refresh Width');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'refreshWidth', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={0}
      id="refresh-width"
      label="Refresh Width"
      max={50}
      min={0}
      unit="mm"
      updateValue={handleChange}
      value={value}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>Refresh Width</span>
      <Input
        hasMultiValue={hasMultiValue}
        id="refresh-width"
        max={50}
        min={0}
        onChange={handleChange}
        precision={0}
        unit="mm"
        value={value}
      />
    </div>
  );
};

export default memo(RefreshWidthBlock);
