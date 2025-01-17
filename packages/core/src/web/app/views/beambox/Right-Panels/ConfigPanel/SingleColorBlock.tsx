import classNames from 'classnames';
import React, { useContext } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';

import colorConstants, { PrintingColors } from 'app/constants/color-constants';
import history from 'app/svgedit/history/history';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import toggleFullColorLayer from 'helpers/layer/full-color/toggleFullColorLayer';
import undoManager from 'app/svgedit/history/undoManager';
import useI18n from 'helpers/useI18n';
import { getData, getMultiSelectData, writeDataLayer } from 'helpers/layer/layer-config-helper';
import { getLayerByName } from 'helpers/layer/layer-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './Block.module.scss';

const SingleColorBlock = (): JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { selectedLayers, state, initState, dispatch } = useContext(ConfigPanelContext);
  const { fullcolor, split, selectedLayer } = state;

  const handleToggleFullColor = () => {
    const batchCmd = new history.BatchCommand('Toggle full color');
    const newVal = !fullcolor.value;
    dispatch({ type: 'change', payload: { fullcolor: newVal } });
    let colorChanged = false;
    const layers = selectedLayers.map((layerName) => getLayerByName(layerName));
    layers.forEach((layer) => {
      if (getData(layer, 'fullcolor') === newVal) return;
      if (
        !newVal &&
        !colorConstants.printingLayerColor.includes(getData(layer, 'color') as PrintingColors)
      ) {
        colorChanged = true;
        writeDataLayer(layer, 'color', PrintingColors.BLACK, { batchCmd });
      }
      const cmd = toggleFullColorLayer(layer, { val: newVal });
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    });
    if (colorChanged) {
      const selectedIdx = selectedLayers.findIndex((layerName) => layerName === selectedLayer);
      const config = getMultiSelectData(layers, selectedIdx, 'color');
      dispatch({ type: 'update', payload: { color: config } });
    }
    LayerPanelController.updateLayerPanel();
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="single-color">
        {t.single_color}
      </label>
      <Tooltip title={t.single_color_desc}>
        <QuestionCircleOutlined className={styles.hint} />
      </Tooltip>
      <Switch
        disabled={split.value}
        className={classNames(styles.switch, { [styles.partial]: fullcolor.hasMultiValue })}
        id="single-color"
        size="small"
        checked={!fullcolor.value}
        onChange={handleToggleFullColor}
      />
    </div>
  );
};

export default SingleColorBlock;
