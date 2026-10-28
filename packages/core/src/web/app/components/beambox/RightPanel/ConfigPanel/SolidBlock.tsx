import React, { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { CUSTOM_PRESET_CONSTANT, writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';

/**
 * Inner engraving, dot mode (Thick Contour): besides the surface, also dot up to two inward shells, the layer
 * spacing apart.
 */
const SolidBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const t = useI18n().inner_engraving_settings;
  const { change, stlSolid } = useConfigPanelStore();
  // absent until the panel state is re-read after inner engraving turned on
  const { hasMultiValue = false, value = false } = stlSolid ?? {};
  const label = t.thick_contour;

  const handleToggle = () => {
    const newVal = !value;

    change({ configName: CUSTOM_PRESET_CONSTANT, stlSolid: newVal });

    if (type === 'modal') return;

    eventEmitterFactory.createEventEmitter('time-estimation-button').emit('SET_ESTIMATED_TIME', null);

    const batchCmd = new history.BatchCommand('Toggle thick contour');

    layerManager.getSelectedLayers().forEach((layerName) => {
      writeData(layerName, 'stlSolid', newVal, { batchCmd });
      writeData(layerName, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Item content={<Switch checked={value} />} id="stl_solid" label={label} onClick={handleToggle} />
  ) : (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="stl_solid">
        {label}
      </label>
      <Tooltip title={t.thick_contour_hint}>
        <QuestionCircleOutlined className={styles.hint} />
      </Tooltip>
      <Switch
        checked={value}
        className={classNames(styles.switch, { [styles.partial]: hasMultiValue })}
        id="stl_solid"
        onChange={handleToggle}
        size="small"
      />
    </div>
  );
};

export default memo(SolidBlock);
