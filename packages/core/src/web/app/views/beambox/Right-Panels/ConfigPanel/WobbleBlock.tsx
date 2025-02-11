import React, { memo, useContext } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const WobbleBlock = (): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { wobbleDiameter, wobbleStep } = state;

  const wobbleOn = wobbleStep.value > 0 && wobbleDiameter.value > 0;
  const handleToggle = () => {
    const newSign = wobbleOn ? -1 : 1;
    const step = Math.abs(wobbleStep.value) * newSign;
    const diameter = Math.abs(wobbleDiameter.value) * newSign;

    dispatch({ payload: { wobbleDiameter: diameter, wobbleStep: step }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change wobble toggle');

    selectedLayers.forEach((layerName) => {
      writeData(layerName, 'wobbleStep', step, { batchCmd });
      writeData(layerName, 'wobbleDiameter', diameter, { batchCmd });
    });
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const handleStepChange = (value: number) => {
    dispatch({ payload: { wobbleStep: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change wobbleStep');

    selectedLayers.forEach((layerName) => writeData(layerName, 'wobbleStep', value, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const handleDiameterChange = (value: number) => {
    dispatch({ payload: { wobbleDiameter: value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change wobbleDiameter');

    selectedLayers.forEach((layerName) => writeData(layerName, 'wobbleDiameter', value, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="wobble">
          {t.wobble}
        </label>
        <Tooltip title={t.wobble_desc}>
          <QuestionCircleOutlined className={styles.hint} />
        </Tooltip>
        <Switch checked={wobbleOn} className={styles.switch} id="wobble" onChange={handleToggle} size="small" />
      </div>
      {wobbleOn && (
        <>
          <div className={classNames(styles.panel, styles['without-drag'])}>
            <span className={styles.title}>{t.wobble_step}</span>
            <UnitInput
              className={{ [styles.input]: true }}
              decimal={2}
              defaultValue={wobbleStep.value}
              displayMultiValue={wobbleStep.hasMultiValue}
              forceUsePropsUnit
              getValue={handleStepChange}
              id="wobble_step"
              max={1}
              min={0.01}
              step={0.01}
              unit="mm"
            />
          </div>
          <div className={classNames(styles.panel, styles['without-drag'])}>
            <span className={styles.title}>{t.wobble_diameter}</span>
            <UnitInput
              className={{ [styles.input]: true }}
              decimal={1}
              defaultValue={wobbleDiameter.value}
              displayMultiValue={wobbleDiameter.hasMultiValue}
              forceUsePropsUnit
              getValue={handleDiameterChange}
              id="wobble_diameter"
              max={1}
              min={0.1}
              step={0.1}
              unit="mm"
            />
          </div>
        </>
      )}
    </>
  );
};

export default memo(WobbleBlock);
