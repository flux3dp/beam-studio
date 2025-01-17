import classNames from 'classnames';
import React, { memo, useContext } from 'react';

import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
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

const FrequencyBlock = ({
  type = 'default',
  min,
  max,
}: {
  type?: 'default' | 'panel-item' | 'modal';
  min: number;
  max: number;
}): JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { frequency } = state;

  const handleChange = (value: number) => {
    // Disable undo if original value is out of range
    const originalValue = frequency.value;
    const noHistory = originalValue > max || originalValue < min;
    dispatch({
      type: 'change',
      payload: { frequency: value, configName: CUSTOM_PRESET_CONSTANT },
    });
    if (type !== 'modal') {
      const batchCmd = noHistory ? undefined : new history.BatchCommand('Change frequency');
      selectedLayers.forEach((layerName) => {
        writeData(layerName, 'frequency', value, { batchCmd });
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
      id="frequency"
      label={t.frequency}
      value={frequency.value}
      min={min}
      max={max}
      updateValue={handleChange}
      unit="kHz"
      decimal={0}
    />
  ) : (
    <div className={classNames(styles.panel, styles['without-drag'])}>
      <span className={styles.title}>{t.frequency}</span>
      <UnitInput
        id="frequency"
        className={{ [styles.input]: true }}
        min={min}
        max={max}
        unit="kHz"
        defaultValue={frequency.value}
        getValue={handleChange}
        decimal={0}
        displayMultiValue={frequency.hasMultiValue}
      />
    </div>
  );
};

export default memo(FrequencyBlock);
