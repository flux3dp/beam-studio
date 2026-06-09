import React, { memo } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';

import styles from './Block.module.scss';
import initState from './initState';
import NumberBlock from './NumberBlock';

const SCurveBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { change, scA0, scAMax, scEnable, scJerk } = useConfigPanelStore();

  const handleEnableToggle = () => {
    const newValue = !scEnable.value;

    change({ scEnable: newValue });

    const batchCmd = new history.BatchCommand('Change S-Curve enable');

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      writeData(layerName, 'scEnable', newValue, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const isCustom = scA0.value > 0 || scAMax.value > 0 || scJerk.value > 0;
  const handleCustomToggle = () => {
    const newSign = isCustom ? -1 : 1;
    const a0 = Math.abs(scA0.value || 3000) * newSign;
    const aMax = Math.abs(scAMax.value || 10000) * newSign;
    const jerk = Math.abs(scJerk.value || 100000) * newSign;

    change({ scA0: a0, scAMax: aMax, scJerk: jerk });

    const batchCmd = new history.BatchCommand('Change S-Curve toggle');

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      writeData(layerName, 'scA0', a0, { batchCmd });
      writeData(layerName, 'scAMax', aMax, { batchCmd });
      writeData(layerName, 'scJerk', jerk, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="s-curve-enable">
          S-Curve
        </label>
        <Switch
          checked={scEnable.value}
          className={styles.switch}
          id="s-curve-enable"
          onChange={handleEnableToggle}
          size="small"
        />
      </div>
      {scEnable.value && (
        <>
          <div className={classNames(styles.panel, styles.switch)}>
            <label className={styles.title} htmlFor="s-curve-custom">
              Custom S-Curve
            </label>
            <Switch
              checked={isCustom}
              className={styles.switch}
              id="s-curve-custom"
              onChange={handleCustomToggle}
              size="small"
            />
          </div>
          {isCustom && (
            <>
              <NumberBlock
                configKey="scA0"
                forceUsePropsUnit
                id="sc_a0"
                max={20000}
                min={0}
                precision={0}
                step={100}
                title="Initial Acc"
                type={type}
                unit="mm/s²"
              />
              <NumberBlock
                configKey="scAMax"
                forceUsePropsUnit
                id="sc_amax"
                max={50000}
                min={0}
                precision={0}
                step={100}
                title="Max Acc"
                type={type}
                unit="mm/s²"
              />
              <NumberBlock
                configKey="scJerk"
                forceUsePropsUnit
                id="sc_jerk"
                max={1000000}
                min={0}
                precision={0}
                step={1000}
                title="Jerk"
                type={type}
                unit="mm/s³"
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default memo(SCurveBlock);
