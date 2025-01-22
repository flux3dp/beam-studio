import React, { memo, useContext } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
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

const Diode = (): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { diode } = state;

  const handleToggle = () => {
    const newValue = diode.value === 1 ? 0 : 1;

    dispatch({ payload: { diode: newValue }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change diode toggle');

    selectedLayers.forEach((layerName) => writeData(layerName, 'diode', newValue, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  return (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="diode">
        {t.diode}
      </label>
      <Switch checked={diode.value === 1} className={styles.switch} id="diode" onChange={handleToggle} size="small" />
    </div>
  );
};

export default memo(Diode);
