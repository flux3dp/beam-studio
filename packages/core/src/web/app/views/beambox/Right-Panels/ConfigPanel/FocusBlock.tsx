import React, { memo, useCallback, useContext, useEffect, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';

// TODO: add tests
const FocusBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { focus, focusStep, repeat } = state;

  const focusStepMax = useMemo(() => {
    if (repeat.value <= 1) {
      return 10;
    }

    return 10 / (repeat.value - 1);
  }, [repeat]);

  const toggleFocusAdjust = () => {
    const value = -focus.value;

    dispatch({ payload: { focus: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Toggle focus adjustment');

    selectedLayers.forEach((layerName) => writeData(layerName, 'focus', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const handleFocusChange = (value: number) => {
    if (value < 0.01 || value > 10) {
      return;
    }

    dispatch({ payload: { focus: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change focus adjustment height');

    selectedLayers.forEach((layerName) => writeData(layerName, 'focus', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const toggleFocusStep = () => {
    const value = -focusStep.value;

    dispatch({ payload: { focusStep: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Toggle focus step');

    selectedLayers.forEach((layerName) => writeData(layerName, 'focusStep', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const handleFocusStepChange = useCallback(
    (value: number) => {
      if (value < 0.01 || value > focusStepMax) {
        return;
      }

      dispatch({ payload: { focusStep: value }, type: 'change' });

      const batchCmd = new history.BatchCommand('Change auto focus z step');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'focusStep', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    },
    [focusStepMax, dispatch, selectedLayers, initState],
  );

  useEffect(() => {
    if (focusStepMax < focusStep.value) {
      handleFocusStepChange(focusStepMax);
    }
  }, [handleFocusStepChange, focusStep, focusStepMax]);

  if (type === 'panel-item') {
    return (
      <>
        <ObjectPanelItem.Number
          decimal={2}
          id="focus-adjustment"
          label={t.focus_adjustment}
          max={10}
          min={0.01}
          unit="mm"
          updateValue={handleFocusChange}
          value={focus.value}
        />
        <ObjectPanelItem.Number
          decimal={2}
          id="focus-step"
          label={t.z_step}
          max={focusStepMax}
          min={0.01}
          unit="mm"
          updateValue={handleFocusChange}
          value={focusStep.value}
        />
      </>
    );
  }

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
          <div className={classNames(styles.panel, styles['without-drag'])}>
            <span className={classNames(styles.title, styles.light)}>{t.by}</span>
            <UnitInput
              className={{ [styles.input]: true }}
              defaultValue={focus.value}
              displayMultiValue={focus.hasMultiValue}
              getValue={handleFocusChange}
              id="focus-adjustment"
              max={10}
              min={0.01}
              unit="mm"
            />
          </div>
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
            <div className={classNames(styles.panel, styles['without-drag'])}>
              <span className={classNames(styles.title, styles.light)}>{t.z_step}</span>
              <UnitInput
                className={{ [styles.input]: true }}
                defaultValue={focusStep.value}
                displayMultiValue={focusStep.hasMultiValue}
                getValue={handleFocusStepChange}
                id="focus-step"
                max={focusStepMax}
                min={0.01}
                unit="mm"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default memo(FocusBlock);
