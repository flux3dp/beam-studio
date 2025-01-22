import React, { memo, useContext, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
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

const DottingTimeBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { dottingTime } = state;
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    [],
  );
  const { hasGradient } = useContext(LayerPanelContext);

  if (!hasGradient) {
    return null;
  }

  const handleChange = (value: number) => {
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, dottingTime: value },
      type: 'change',
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
      decimal={0}
      id="dottingTime"
      label={t.dottingTime}
      max={10000}
      min={1}
      unit="us"
      updateValue={handleChange}
      value={dottingTime.value}
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
        className={{ [styles.input]: true }}
        decimal={0}
        defaultValue={dottingTime.value}
        displayMultiValue={dottingTime.hasMultiValue}
        getValue={handleChange}
        id="dottingTime"
        max={10000}
        min={1}
        step={1}
        unit="us"
      />
    </div>
  );
};

export default memo(DottingTimeBlock);
