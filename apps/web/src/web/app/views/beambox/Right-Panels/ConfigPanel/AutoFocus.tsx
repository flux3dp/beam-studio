import classNames from 'classnames';
import React, { memo, useContext } from 'react';
import { Switch } from 'antd';

import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { CUSTOM_PRESET_CONSTANT, writeData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './Block.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const AutoFocus = (): JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { height, repeat, zStep } = state;

  const handleToggle = () => {
    const value = -height.value;
    dispatch({ type: 'change', payload: { height: value } });
    const batchCmd = new history.BatchCommand('Change auto focus toggle');
    selectedLayers.forEach((layerName) => writeData(layerName, 'height', value, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const handleHeightChange = (value: number) => {
    dispatch({ type: 'change', payload: { height: value } });
    const batchCmd = new history.BatchCommand('Change auto focus height');
    selectedLayers.forEach((layerName) => writeData(layerName, 'height', value, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const handleZStepChange = (value: number) => {
    dispatch({ type: 'change', payload: { zStep: value, configName: CUSTOM_PRESET_CONSTANT } });
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
          className={styles.switch}
          id="auto-focus"
          size="small"
          checked={height.value > 0}
          onChange={handleToggle}
        />
      </div>
      {height.value > 0 ? (
        <div className={classNames(styles.panel, styles['without-drag'])}>
          <span className={styles.title}>{t.height}</span>
          <UnitInput
            id="height"
            className={{ [styles.input]: true }}
            min={0.01}
            max={20}
            unit="mm"
            defaultValue={height.value}
            getValue={handleHeightChange}
            displayMultiValue={height.hasMultiValue}
          />
        </div>
      ) : null}
      {repeat.value > 1 && height.value > 0 ? (
        <div className={classNames(styles.panel, styles['without-drag'])}>
          <span className={styles.title}>{t.z_step}</span>
          <UnitInput
            id="z_step"
            className={{ [styles.input]: true }}
            min={0}
            max={20}
            unit="mm"
            defaultValue={zStep.value}
            getValue={handleZStepChange}
            displayMultiValue={zStep.hasMultiValue}
          />
        </div>
      ) : null}
    </>
  );
};

export default memo(AutoFocus);
