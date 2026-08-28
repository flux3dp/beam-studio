import React, { memo } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';

import styles from './Block.module.scss';
import initState from './initState';

const BlendKWithCmyBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const { blendKWithCmy, change } = useConfigPanelStore();

  const handleToggle = () => {
    const newValue = !blendKWithCmy.value;

    change({ blendKWithCmy: newValue });

    if (type === 'modal') return;

    const batchCmd = new history.BatchCommand('Change blend K with CMY');

    layerManager.getSelectedLayers().forEach((layerName) => {
      writeData(layerName, 'blendKWithCmy', newValue, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="blend-k-with-cmy">
        Blend K with CMY
      </label>
      <Switch
        checked={blendKWithCmy.value}
        className={styles.switch}
        id="blend-k-with-cmy"
        onChange={handleToggle}
        size="small"
      />
    </div>
  );
};

export default memo(BlendKWithCmyBlock);
