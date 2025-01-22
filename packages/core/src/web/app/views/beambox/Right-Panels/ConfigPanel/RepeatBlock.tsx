import React, { memo, useContext, useMemo } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
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

const RepeatBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { repeat } = state;
  const timeEstimationButtonEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('time-estimation-button'),
    [],
  );

  const handleChange = (value: number) => {
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, repeat: value },
      type: 'change',
    });
    timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change repeat');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'repeat', value, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={0}
      id="repeat"
      label={t.repeat}
      max={100}
      min={0}
      unit={t.times}
      updateValue={handleChange}
      value={repeat.value}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>{t.repeat}</span>
      <UnitInput
        className={{ [styles.input]: true }}
        decimal={0}
        defaultValue={repeat.value}
        displayMultiValue={repeat.hasMultiValue}
        getValue={handleChange}
        id="repeat"
        max={100}
        min={0}
        unit={t.times}
      />
    </div>
  );
};

export default memo(RepeatBlock);
