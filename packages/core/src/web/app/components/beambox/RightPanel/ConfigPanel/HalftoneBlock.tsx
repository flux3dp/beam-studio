import React, { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import Select from '@core/app/widgets/AntdSelect';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './HalftoneBlock.module.scss';
import initState from './initState';

const HalftoneBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;

  const { change, halftone } = useConfigPanelStore();

  const { hasMultiValue, value } = halftone;

  const handleChange = (newValue: number) => {
    if (newValue === value && !hasMultiValue) {
      return;
    }

    change({ halftone: newValue });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Halftone');

      useLayerStore
        .getState()
        .selectedLayers.forEach((layerName) => writeData(layerName, 'halftone', newValue, { batchCmd }));
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const options = [
    { label: 'FM', value: 1 },
    { label: 'AM', value: 2 },
  ];

  return type === 'panel-item' ? (
    <ObjectPanelItem.Select
      id="halftone-type"
      label={lang.halftone}
      onChange={handleChange}
      options={options}
      selected={hasMultiValue ? { label: '-', value: 0 } : options[value - 1]}
    />
  ) : (
    <div className={classNames(styles.panel)}>
      <span className={styles.title}>
        {lang.halftone}
        <QuestionCircleOutlined className={styles.icon} onClick={() => browser.open(lang.halftone_link)} />
      </span>
      <Select
        className={styles['inline-select']}
        onChange={handleChange}
        options={options}
        value={hasMultiValue ? '-' : value}
      />
    </div>
  );
};

export default memo(HalftoneBlock);
