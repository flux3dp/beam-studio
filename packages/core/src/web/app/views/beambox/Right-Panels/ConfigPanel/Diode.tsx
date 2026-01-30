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

const Diode = (): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, diode } = useConfigPanelStore();

  const handleToggle = () => {
    const newValue = diode.value === 1 ? 0 : 1;

    change({ diode: newValue });

    const batchCmd = new history.BatchCommand('Change diode toggle');

    useLayerStore
      .getState()
      .selectedLayers.forEach((layerName) => writeData(layerName, 'diode', newValue, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="diode">
        {t.diode}
      </label>
      <Switch checked={diode.value === 1} className={styles.switch} id="diode" onChange={handleToggle} size="small" />
    </div>
  );
};

export default memo(Diode);
