import classNames from 'classnames';
import React, { memo, useCallback, useContext, useEffect, useMemo } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';

import history from 'app/svgedit/history/history';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from 'app/widgets/Unit-Input-v2';
import undoManager from 'app/svgedit/history/undoManager';
import useI18n from 'helpers/useI18n';
import { writeData } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './Block.module.scss';

// TODO: add tests
const FocusBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { focus, focusStep, repeat } = state;

  const focusStepMax = useMemo(() => {
    if (repeat.value <= 1) return 10;
    return 10 / (repeat.value - 1);
  }, [repeat]);

  const toggleFocusAdjust = () => {
    const value = -focus.value;
    dispatch({ type: 'change', payload: { focus: value } });
    const batchCmd = new history.BatchCommand('Toggle focus adjustment');
    selectedLayers.forEach((layerName) => writeData(layerName, 'focus', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const handleFocusChange = (value: number) => {
    if (value < 0.01 || value > 10) return;
    dispatch({ type: 'change', payload: { focus: value } });
    const batchCmd = new history.BatchCommand('Change focus adjustment height');
    selectedLayers.forEach((layerName) => writeData(layerName, 'focus', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const toggleFocusStep = () => {
    const value = -focusStep.value;
    dispatch({ type: 'change', payload: { focusStep: value } });
    const batchCmd = new history.BatchCommand('Toggle focus step');
    selectedLayers.forEach((layerName) => writeData(layerName, 'focusStep', value, { batchCmd }));
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  const handleFocusStepChange = useCallback(
    (value: number) => {
      if (value < 0.01 || value > focusStepMax) return;
      dispatch({ type: 'change', payload: { focusStep: value } });
      const batchCmd = new history.BatchCommand('Change auto focus z step');
      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'focusStep', value, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    },
    [focusStepMax, dispatch, selectedLayers, initState]
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
          id="focus-adjustment"
          label={t.focus_adjustment}
          value={focus.value}
          min={0.01}
          max={10}
          updateValue={handleFocusChange}
          unit="mm"
          decimal={2}
        />
        <ObjectPanelItem.Number
          id="focus-step"
          label={t.z_step}
          value={focusStep.value}
          min={0.01}
          max={focusStepMax}
          updateValue={handleFocusChange}
          unit="mm"
          decimal={2}
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
            className={styles.switch}
            id="lower-focus"
            size="small"
            checked={focus.value > 0}
            onChange={toggleFocusAdjust}
          />
        </div>
        {focus.value >= 0 && (
          <div className={classNames(styles.panel, styles['without-drag'])}>
            <span className={classNames(styles.title, styles.light)}>{t.by}</span>
            <UnitInput
              id="focus-adjustment"
              className={{ [styles.input]: true }}
              min={0.01}
              max={10}
              unit="mm"
              defaultValue={focus.value}
              getValue={handleFocusChange}
              displayMultiValue={focus.hasMultiValue}
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
              className={styles.switch}
              id="focus-step-toggle"
              size="small"
              checked={focusStep.value > 0}
              onChange={toggleFocusStep}
            />
          </div>
          {focusStep.value >= 0 && (
            <div className={classNames(styles.panel, styles['without-drag'])}>
              <span className={classNames(styles.title, styles.light)}>{t.z_step}</span>
              <UnitInput
                id="focus-step"
                className={{ [styles.input]: true }}
                min={0.01}
                max={focusStepMax}
                unit="mm"
                defaultValue={focusStep.value}
                getValue={handleFocusStepChange}
                displayMultiValue={focusStep.hasMultiValue}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default memo(FocusBlock);
