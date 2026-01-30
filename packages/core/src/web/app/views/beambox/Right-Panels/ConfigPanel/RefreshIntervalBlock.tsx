import React, { memo } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';
import NumberBlock from './NumberBlock';

const RefreshIntervalBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  const { change, refreshInterval } = useConfigPanelStore();
  const t = useI18n().beambox.right_panel.laser_panel;

  const handleToggle = () => {
    const value = -refreshInterval.value;

    change({ refreshInterval: value });

    const batchCmd = new history.BatchCommand('Change Printer Refresh Toggle');

    useLayerStore
      .getState()
      .selectedLayers.forEach((layerName) => writeData(layerName, 'refreshInterval', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="refresh-printer">
          {t.refresh_printer}
        </label>
        <Switch
          checked={refreshInterval.value > 0}
          className={styles.switch}
          id="refresh-printer"
          onChange={handleToggle}
          size="small"
        />
      </div>
      {refreshInterval.value > 0 && (
        <NumberBlock
          configKey="refreshInterval"
          id="refreshInterval"
          max={60}
          min={20}
          panelType="button"
          title={t.refresh_interval}
          type={type}
          unit="sec"
        />
      )}
    </>
  );
};

export default memo(RefreshIntervalBlock);
