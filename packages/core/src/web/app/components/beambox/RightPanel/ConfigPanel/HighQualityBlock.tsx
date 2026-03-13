import React, { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';

const HighQualityBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, highQuality } = useConfigPanelStore();

  const handleToggle = () => {
    const newVal = !highQuality.value;

    change({ highQuality: newVal });

    if (type === 'modal') return;

    eventEmitterFactory.createEventEmitter('time-estimation-button').emit('SET_ESTIMATED_TIME', null);

    const batchCmd = new history.BatchCommand('Toggle high quality');

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      writeData(layerName, 'highQuality', newVal, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Item
      content={<Switch checked={highQuality.value} />}
      id="high_quality"
      label={t.high_quality}
      onClick={handleToggle}
    />
  ) : (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="high_quality">
        {t.high_quality}
      </label>
      <Tooltip title={t.high_quality_desc}>
        <QuestionCircleOutlined className={styles.hint} />
      </Tooltip>
      <Switch
        checked={highQuality.value}
        className={classNames(styles.switch, { [styles.partial]: highQuality.hasMultiValue })}
        id="high_quality"
        onChange={handleToggle}
        size="small"
      />
    </div>
  );
};

export default memo(HighQualityBlock);
