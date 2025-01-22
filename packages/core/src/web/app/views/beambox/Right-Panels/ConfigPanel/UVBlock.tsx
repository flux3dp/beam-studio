import React, { memo, useContext } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const UVBlock = (): React.JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel.ink_type;
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { uv } = state;

  const handleToggle = () => {
    const newValue = uv.value === 1 ? 0 : 1;

    dispatch({ payload: { uv: newValue }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change UV toggle');

    selectedLayers.forEach((layerName) => writeData(layerName, 'uv', newValue, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const options = [
    { label: t.normal, value: 0 },
    { label: t.UV, value: 1 },
  ];

  return isMobile ? (
    <ObjectPanelItem.Select
      id="ink-type"
      label={t.text}
      onChange={handleToggle}
      options={options}
      selected={uv.value === 1 ? options[1] : options[0]}
    />
  ) : (
    <div className={classNames(styles.panel, styles.switch)} onClick={handleToggle}>
      <label className={styles.title} htmlFor="uv-ink">
        UV
      </label>
      <Switch checked={uv.value === 1} className={styles.switch} id="uv-ink" onChange={handleToggle} size="small" />
    </div>
  );
};

export default memo(UVBlock);
