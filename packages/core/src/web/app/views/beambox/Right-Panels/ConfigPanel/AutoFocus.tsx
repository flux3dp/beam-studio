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

const AutoFocus = (): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, height, repeat } = useConfigPanelStore();

  const handleToggle = () => {
    const value = -height.value;

    change({ height: value });

    const batchCmd = new history.BatchCommand('Change auto focus toggle');

    useLayerStore.getState().selectedLayers.forEach((layerName) => writeData(layerName, 'height', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="auto-focus">
          {t.focus_adjustment}
        </label>
        <Switch
          checked={height.value > 0}
          className={styles.switch}
          id="auto-focus"
          onChange={handleToggle}
          size="small"
        />
      </div>
      {height.value > 0 ? (
        <NumberBlock
          configKey="height"
          id="height"
          max={20}
          min={0.01}
          precision={2}
          step={0.01}
          title={t.height}
          unit="mm"
        />
      ) : null}
      {repeat.value > 1 && height.value > 0 ? (
        <NumberBlock
          configKey="zStep"
          id="zStep"
          max={20}
          min={0}
          precision={2}
          step={0.01}
          title={t.z_step}
          unit="mm"
        />
      ) : null}
    </>
  );
};

export default memo(AutoFocus);
