import React, { memo, useContext } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';
import initState from '../initState';
import NumberBlock from '../NumberBlock';

const UVCuring = memo(({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }) => {
  const { change, uvCuringAfter } = useConfigPanelStore();
  const { selectedLayers } = useContext(ConfigPanelContext);
  const handleToggle = () => {
    const newVal = !uvCuringAfter.value;

    change({ uvCuringAfter: newVal });

    const batchCmd = new history.BatchCommand('Change auto focus toggle');

    selectedLayers.forEach((layerName) => writeData(layerName, 'uvCuringAfter', newVal, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="uv-curing-after">
          Curing After Print
        </label>
        <Switch
          checked={uvCuringAfter.value}
          className={styles.switch}
          id="uv-curing-after"
          onChange={handleToggle}
          size="small"
        />
      </div>
      {uvCuringAfter.value && (
        <NumberBlock
          configKey="uvCuringRepeat"
          id="uvCuringRepeat"
          max={20}
          min={1}
          title="UV Curing Repeat"
          type={type}
          unit="mm"
        />
      )}
    </>
  );
});

export default UVCuring;
