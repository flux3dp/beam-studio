import React, { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './Block.module.scss';
import initState from './initState';

const CurveEngravingZHighSpeed = () => {
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
  } = useI18n();
  const {
    ceZHighSpeed: { hasMultiValue, value },
    change,
  } = useConfigPanelStore();
  const checked = useMemo(() => value || hasMultiValue, [value, hasMultiValue]);

  const handleToggle = () => {
    change({ ceZHighSpeed: !checked });

    const batchCmd = new history.BatchCommand('Change curve engraving z speed limit');

    useLayerStore
      .getState()
      .selectedLayers.forEach((layerName) => writeData(layerName, 'ceZHighSpeed', !checked, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="curve-engraving-z-high-speed">
        {t.ce_z_high_speed}
        <QuestionCircleOutlined
          className={classNames(styles.hint, styles.link)}
          onClick={(e) => {
            // prevent label from being triggered
            e.stopPropagation();
            e.preventDefault();
            browser.open(t.ce_z_high_speed_link);
          }}
        />
      </label>
      <Switch
        checked={checked}
        className={styles.switch}
        id="curve-engraving-z-high-speed"
        onChange={handleToggle}
        size="small"
      />
    </div>
  );
};

export default CurveEngravingZHighSpeed;
