import React, { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import { pick } from 'remeda';
import { sprintf } from 'sprintf-js';
import { useShallow } from 'zustand/shallow';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';
import NumberBlock from './NumberBlock';

interface Props {
  type?: 'default' | 'modal' | 'panel-item';
}

const LaserFrequencyBlock = ({ type = 'default' }: Props): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const workarea = useWorkarea();
  const { change, laserFrequency } = useConfigPanelStore(useShallow(pick(['change', 'laserFrequency'])));
  // AdvancedBlock only renders this block when the workarea has a default
  const defaultFrequency = getWorkarea(workarea).defaultLaserFrequency!;
  const isOn = laserFrequency.value > 0;

  const handleToggle = () => {
    const newVal = isOn ? 0 : defaultFrequency;

    change({ laserFrequency: newVal });

    if (type === 'modal') return;

    const batchCmd = new history.BatchCommand('Toggle Laser Frequency');

    layerManager.getSelectedLayers().forEach((layerName) => {
      writeData(layerName, 'laserFrequency', newVal, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <div className={styles.block}>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="laser-frequency">
          {t.laser_frequency}
        </label>
        <Tooltip title={t.laser_frequency_desc}>
          <QuestionCircleOutlined className={styles.hint} />
        </Tooltip>
        <Switch
          checked={isOn}
          className={classNames(styles.switch, { [styles.partial]: laserFrequency.hasMultiValue })}
          id="laser-frequency"
          onChange={handleToggle}
          size="small"
        />
      </div>
      {isOn && (
        <>
          <NumberBlock
            configKey="laserFrequency"
            hasSlider
            id="laser-frequency-value"
            lightTitle
            max={500}
            min={20}
            title={t.frequency}
            type={type}
            unit="kHz"
          />
          <div className={classNames(styles.panel, styles.caption)}>
            {sprintf(t.laser_frequency_default, defaultFrequency)}
          </div>
        </>
      )}
    </div>
  );
};

export default memo(LaserFrequencyBlock);
