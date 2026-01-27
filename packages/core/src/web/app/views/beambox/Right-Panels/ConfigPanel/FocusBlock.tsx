import React, { memo, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import isDev from '@core/helpers/is-dev';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';
import NumberBlock from './NumberBlock';

// TODO: add tests
const FocusBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { change, focus, focusStep, repeat } = useConfigPanelStore();
  const isDevMode = useMemo(() => isDev(), []);

  const focusStepMax = useMemo(() => {
    if (isDevMode) return 40;

    if (repeat.value <= 1) {
      return 10;
    }

    return 10 / (repeat.value - 1);
  }, [repeat, isDevMode]);

  const toggleFocusAdjust = () => {
    const value = -focus.value;

    change({ focus: value });

    const batchCmd = new history.BatchCommand('Toggle focus adjustment');

    useLayerStore.getState().selectedLayers.forEach((layerName) => writeData(layerName, 'focus', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const toggleFocusStep = () => {
    const value = -focusStep.value;

    change({ focusStep: value });

    const batchCmd = new history.BatchCommand('Toggle focus step');

    useLayerStore
      .getState()
      .selectedLayers.forEach((layerName) => writeData(layerName, 'focusStep', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={styles.block}>
        <div className={classNames(styles.panel, styles.switch)}>
          <label className={styles.title} htmlFor="lower-focus">
            {t.lower_focus}
          </label>
          <Tooltip title={t.lower_focus_desc}>
            <QuestionCircleOutlined className={styles.hint} />
          </Tooltip>
          <Switch
            checked={focus.value > 0}
            className={styles.switch}
            id="lower-focus"
            onChange={toggleFocusAdjust}
            size="small"
          />
        </div>
        {focus.value >= 0 && (
          <NumberBlock
            configKey="focus"
            id="focus-adjustment"
            lightTitle
            max={isDevMode ? 40 : 10}
            min={0.01}
            precision={2}
            title={t.by}
            type={type}
            unit="mm"
          />
        )}
      </div>
      {repeat.value > 1 && (
        <div className={styles.block}>
          <div className={classNames(styles.panel, styles.switch)}>
            <label className={styles.title} htmlFor="focus-step-toggle">
              {t.stepwise_focusing}
            </label>
            <Tooltip title={t.stepwise_focusing_desc}>
              <QuestionCircleOutlined className={styles.hint} />
            </Tooltip>
            <Switch
              checked={focusStep.value > 0}
              className={styles.switch}
              id="focus-step-toggle"
              onChange={toggleFocusStep}
              size="small"
            />
          </div>
          {focusStep.value >= 0 && (
            <NumberBlock
              configKey="focusStep"
              id="focus-step"
              lightTitle
              max={focusStepMax}
              min={0.01}
              precision={2}
              title={t.z_step}
              unit="mm"
            />
          )}
        </div>
      )}
    </>
  );
};

export default memo(FocusBlock);
