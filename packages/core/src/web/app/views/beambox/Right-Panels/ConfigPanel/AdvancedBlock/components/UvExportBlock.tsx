import React, { memo, useContext } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import { setLayerFullColor } from '@core/helpers/layer/full-color/setLayerFullColor';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import LayerPanelController from '../../../contexts/LayerPanelController';
import styles from '../../Block.module.scss';
import ConfigPanelContext from '../../ConfigPanelContext';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

function UvExportBlock(): React.ReactNode {
  const lang = useI18n();
  const {
    dispatch,
    initState,
    selectedLayers,
    state: { module, 'uv-export': uvExport },
  } = useContext(ConfigPanelContext);

  const handleToggle = () => {
    const value = !uvExport.value;

    dispatch({ payload: { 'uv-export': value }, type: 'change' });

    const batchCmd = new history.BatchCommand('Change UV export mode');

    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName);

      writeDataLayer(layer, 'uv-export', value, { batchCmd });
      writeDataLayer(layer, 'repeat', value ? 0 : 1, { batchCmd });

      batchCmd.addSubCommand(setLayerFullColor(layer, value || module.value === LayerModule.PRINTER));
    });

    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);

    svgEditor.updateContextPanel();
    LayerPanelController.updateLayerPanel();
  };

  return (
    <>
      <div className={classNames(styles.panel, styles.switch)}>
        <label className={styles.title} htmlFor="uv-export">
          {lang.beambox.right_panel.uv_export_block.title}
        </label>
        <Switch
          checked={uvExport.value}
          className={styles.switch}
          id="uv-export"
          onChange={handleToggle}
          size="small"
        />
      </div>
    </>
  );
}

export default memo(UvExportBlock);
