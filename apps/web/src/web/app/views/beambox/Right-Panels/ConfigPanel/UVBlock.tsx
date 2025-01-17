import classNames from 'classnames';
import React, { memo, useContext } from 'react';
import { Switch } from 'antd';

import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import useI18n from 'helpers/useI18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';
import { writeData } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './Block.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const UVBlock = (): JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel.ink_type;
  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { uv } = state;

  const handleToggle = () => {
    const newValue = uv.value === 1 ? 0 : 1;
    dispatch({ type: 'change', payload: { uv: newValue } });
    const batchCmd = new history.BatchCommand('Change UV toggle');
    selectedLayers.forEach((layerName) => writeData(layerName, 'uv', newValue, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  const options = [
    { value: 0, label: t.normal },
    { value: 1, label: t.UV },
  ];

  return isMobile ? (
    <ObjectPanelItem.Select
      id="ink-type"
      selected={uv.value === 1 ? options[1] : options[0]}
      onChange={handleToggle}
      options={options}
      label={t.text}
    />
  ) : (
    <div className={classNames(styles.panel, styles.switch)} onClick={handleToggle}>
      <label className={styles.title} htmlFor="uv-ink">UV</label>
      <Switch
        className={styles.switch}
        id="uv-ink"
        size="small"
        checked={uv.value === 1}
        onChange={handleToggle}
      />
    </div>
  );
};

export default memo(UVBlock);
