import classNames from 'classnames';
import React, { memo, useContext, useMemo } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { CUSTOM_PRESET_CONSTANT, writeData } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './Block.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const DottingTimeBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { dottingTime } = state;
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    []
  );
  const { hasGradient } = useContext(LayerPanelContext);
  if (!hasGradient) return null;

  const handleChange = (value: number) => {
    dispatch({
      type: 'change',
      payload: { dottingTime: value, configName: CUSTOM_PRESET_CONSTANT },
    });
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change dotting time');
      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'dottingTime', value, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      id="dottingTime"
      label={t.dottingTime}
      value={dottingTime.value}
      min={1}
      max={10000}
      decimal={0}
      unit="us"
      updateValue={handleChange}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>
        {t.dottingTime}
        <Tooltip overlayClassName={styles['hint-overlay']} title={t.gradient_only}>
          <QuestionCircleOutlined className={styles.hint} />
        </Tooltip>
      </span>
      <UnitInput
        id="dottingTime"
        className={{ [styles.input]: true }}
        min={1}
        max={10000}
        decimal={0}
        unit="us"
        step={1}
        defaultValue={dottingTime.value}
        getValue={handleChange}
        displayMultiValue={dottingTime.hasMultiValue}
      />
    </div>
  );
};

export default memo(DottingTimeBlock);
