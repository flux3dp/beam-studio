import React, { memo, useCallback } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import styles from '../Block.module.scss';
import { initState } from '../initState';

const OneWayEngraving = ({ noApply }: CommonProps) => {
  const { change, oneWayEngraving, oneWayEngravingReverse } = useConfigPanelStore();

  const handleToggle = useCallback(
    (key: 'oneWayEngraving' | 'oneWayEngravingReverse', val: boolean) => {
      const selectedLayers = useLayerStore.getState().selectedLayers;

      change({ [key]: val });

      if (noApply) return;

      const batchCmd = new history.BatchCommand(`Change ${key} toggle`);

      selectedLayers.forEach((layerName) => writeData(layerName, key, val, { batchCmd }));
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    },
    [change, noApply],
  );

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="one-way-engraving">
          One Way Engraving
        </label>
        <Switch
          checked={oneWayEngraving.value}
          className={styles.switch}
          id="one-way-engraving"
          onChange={(val) => handleToggle('oneWayEngraving', val)}
          size="small"
        />
      </div>
      {oneWayEngraving.value && (
        <div className={classNames(styles.panel, styles.switch)}>
          <label className={styles.title} htmlFor="one-way-engraving-reverse">
            Reverse Direction
          </label>
          <Switch
            checked={oneWayEngravingReverse.value}
            className={styles.switch}
            id="one-way-engraving-reverse"
            onChange={(val) => handleToggle('oneWayEngravingReverse', val)}
            size="small"
          />
        </div>
      )}
    </>
  );
};

export default memo(OneWayEngraving);
