import React, { memo, useContext } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';
import NumberBlock from './NumberBlock';

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
    undoManager.addCommandToHistory(batchCmd);
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
          <NumberBlock
            configKey="wobbleStep"
            forceUsePropsUnit
            id="wobble_step"
            max={1}
            min={0.01}
            precision={2}
            step={0.01}
            title={t.wobble_step}
            unit="mm"
          />
          <NumberBlock
            configKey="wobbleDiameter"
            forceUsePropsUnit
            id="wobble_diameter"
            max={1}
            min={0.1}
            precision={1}
            step={0.1}
            title={t.wobble_diameter}
            unit="mm"
          />
        </>
      )}
    </>
  );
};

export default memo(WobbleBlock);
