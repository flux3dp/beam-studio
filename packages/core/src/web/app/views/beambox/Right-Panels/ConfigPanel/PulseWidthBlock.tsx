import React, { memo, useContext } from 'react';

import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
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

const PulseWidthBlock = ({
  max,
  min,
  type = 'default',
}: {
  max: number;
  min: number;
  type?: 'default' | 'modal' | 'panel-item';
}): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { pulseWidth } = state;

  const handleChange = (value: number) => {
    // Disable undo if original value is out of range
    const originalValue = pulseWidth.value;
    const noHistory = originalValue > max || originalValue < min;

    console.log('PulseWidthBlock handleChange value:', value, noHistory, pulseWidth.value);
    dispatch({
      payload: { configName: CUSTOM_PRESET_CONSTANT, pulseWidth: value },
      type: 'change',
    });

    if (type !== 'modal') {
      const batchCmd = noHistory ? undefined : new history.BatchCommand('Change pulseWidth');

      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'pulseWidth', value, { batchCmd });
        writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      });

      if (!noHistory) {
        batchCmd.onAfter = initState;
        svgCanvas.addCommandToHistory(batchCmd);
      }
    }
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Number
      decimal={0}
      id="pulseWidth"
      label={t.pulse_width}
      max={max}
      min={min}
      unit="ns"
      updateValue={handleChange}
      value={pulseWidth.value}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>{t.pulse_width}</span>
      <UnitInput
        className={{ [styles.input]: true }}
        decimal={0}
        defaultValue={pulseWidth.value}
        displayMultiValue={pulseWidth.hasMultiValue}
        getValue={handleChange}
        id="pulseWidth"
        max={max}
        min={min}
        unit="ns"
      />
    </div>
  );
};

export default memo(PulseWidthBlock);
