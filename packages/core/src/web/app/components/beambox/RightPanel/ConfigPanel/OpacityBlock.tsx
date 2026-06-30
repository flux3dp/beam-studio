import React, { memo } from 'react';

import { ExclamationCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import ConfigSlider from '@core/app/components/beambox/RightPanel/ConfigPanel/ConfigSlider';
import ConfigValueDisplay from '@core/app/components/beambox/RightPanel/ConfigPanel/ConfigValueDisplay';
import { initState } from '@core/app/components/beambox/RightPanel/ConfigPanel/initState';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { mockT } from '@core/helpers/is-dev';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';

const MAX_VALUE = 100;
const MIN_VALUE = 0;

const OpacityBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, opacity } = useConfigPanelStore();
  const handleChange = (value: number) => {
    change({ opacity: value });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change opacity');

      useLayerStore.getState().selectedLayers.forEach((layerName) => {
        writeData(layerName, 'opacity', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  return (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{mockT('Opacity')}</span>
      <ConfigValueDisplay
        hasMultiValue={opacity.hasMultiValue}
        inputId="opacity-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        type={type}
        unit="%"
        value={opacity.value}
      />
      <ConfigSlider
        id="opacity"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={handleChange}
        step={1}
        value={opacity.value}
      />
      <div className={styles.warning}>
        <div className={styles['warning-icon']}>
          <ExclamationCircleOutlined />
        </div>
        <div className={styles['warning-text']}>
          {mockT('This layer is for alignment reference only and will not be processed when the job is sent.')}
        </div>
      </div>
    </div>
  );
};

export default memo(OpacityBlock);
