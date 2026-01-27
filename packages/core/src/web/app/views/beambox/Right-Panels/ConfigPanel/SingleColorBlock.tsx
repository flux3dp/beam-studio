import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import colorConstants, { PrintingColors } from '@core/app/constants/color-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { getData, getMultiSelectData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

import styles from './Block.module.scss';
import initState from './initState';

const SingleColorBlock = (): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const { change, fullcolor, split, update } = useConfigPanelStore();

  const handleToggleFullColor = () => {
    const batchCmd = new history.BatchCommand('Toggle full color');
    const newVal = !fullcolor.value;

    change({ fullcolor: newVal });

    let colorChanged = false;
    const selectedLayers = useLayerStore.getState().selectedLayers;
    const layers = selectedLayers.map((layerName) => getLayerByName(layerName)!);

    layers.forEach((layer) => {
      if (getData(layer, 'fullcolor') === newVal) {
        return;
      }

      if (!newVal && !colorConstants.printingLayerColor.includes(getData(layer, 'color') as PrintingColors)) {
        colorChanged = true;
        writeDataLayer(layer, 'color', PrintingColors.BLACK, { batchCmd });
      }

      const cmd = toggleFullColorLayer(layer, { val: newVal });

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
    });

    if (colorChanged) {
      const currentLayerName = layerManager.getCurrentLayerName();
      const selectedIdx = selectedLayers.findIndex((layerName) => layerName === currentLayerName);
      const config = getMultiSelectData(layers, selectedIdx, 'color') as ConfigItem<string>;

      update({ color: config });
    }

    useLayerStore.getState().forceUpdate();
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
        checked={!fullcolor.value}
        className={classNames(styles.switch, { [styles.partial]: fullcolor.hasMultiValue })}
        disabled={split.value}
        id="single-color"
        onChange={handleToggleFullColor}
        size="small"
      />
    </div>
  );
};

export default SingleColorBlock;
