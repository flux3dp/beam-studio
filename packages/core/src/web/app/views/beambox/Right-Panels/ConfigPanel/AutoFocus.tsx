import React, { memo, useContext } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const AutoFocus = (): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { height, repeat, zStep } = state;

  const handleToggle = () => {
    const value = -height.value;

    dispatch({ payload: { height: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change auto focus toggle');

    selectedLayers.forEach((layerName) => writeData(layerName, 'height', value, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const handleHeightChange = (value: number) => {
    dispatch({ payload: { height: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change auto focus height');

    selectedLayers.forEach((layerName) => writeData(layerName, 'height', value, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const handleZStepChange = (value: number) => {
    dispatch({ payload: { configName: CUSTOM_PRESET_CONSTANT, zStep: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change auto focus z step');

    selectedLayers.forEach((layerName) => {
      writeData(layerName, 'zStep', value, { batchCmd });
      writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
    });
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="auto-focus">
          {t.focus_adjustment}
        </label>
        <Switch
          checked={height.value > 0}
          className={styles.switch}
          id="auto-focus"
          onChange={handleToggle}
          size="small"
        />
      </div>
      {height.value > 0 ? (
        <div className={classNames(styles.panel, styles['without-drag'])}>
          <span className={styles.title}>{t.height}</span>
          <UnitInput
            className={{ [styles.input]: true }}
            defaultValue={height.value}
            displayMultiValue={height.hasMultiValue}
            getValue={handleHeightChange}
            id="height"
            max={20}
            min={0.01}
            unit="mm"
          />
        </div>
      ) : null}
      {repeat.value > 1 && height.value > 0 ? (
        <div className={classNames(styles.panel, styles['without-drag'])}>
          <span className={styles.title}>{t.z_step}</span>
          <UnitInput
            className={{ [styles.input]: true }}
            defaultValue={zStep.value}
            displayMultiValue={zStep.hasMultiValue}
            getValue={handleZStepChange}
            id="z_step"
            max={20}
            min={0}
            unit="mm"
          />
        </div>
      ) : null}
    </>
  );
};

export default memo(AutoFocus);
