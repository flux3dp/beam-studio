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
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './initState';

/**
 * Inner engraving, line mode: besides the slice contours, also fill the faces that look straight up or
 * down, at the face fill interval.
 *
 * Not part of a preset: it is a choice about the shape, not the material, so the layer keeps its preset
 * and applying another preset keeps it.
 */
const FillCapsBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const t = useI18n().inner_engraving_settings;
  const { change, stlFillCaps } = useConfigPanelStore();
  // absent until the panel state is re-read after inner engraving turned on
  const { hasMultiValue = false, value = false } = stlFillCaps ?? {};
  const label = t.fill_caps;

  const handleToggle = () => {
    const newVal = !value;

    change({ stlFillCaps: newVal });

    if (type === 'modal') return;

    eventEmitterFactory.createEventEmitter('time-estimation-button').emit('SET_ESTIMATED_TIME', null);

    const batchCmd = new history.BatchCommand('Toggle face fill');

    layerManager.getSelectedLayers().forEach((layerName) => {
      writeData(layerName, 'stlFillCaps', newVal, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  return type === 'panel-item' ? (
    <ObjectPanelItem.Item
      content={<Switch checked={value} />}
      id="stl_fill_caps"
      label={label}
      onClick={handleToggle}
    />
  ) : (
    <div className={classNames(styles.panel, styles.switch)}>
      <label className={styles.title} htmlFor="stl_fill_caps">
        {label}
      </label>
      <Tooltip title={t.fill_caps_hint}>
        <QuestionCircleOutlined className={styles.hint} />
      </Tooltip>
      <Switch
        checked={value}
        className={classNames(styles.switch, { [styles.partial]: hasMultiValue })}
        id="stl_fill_caps"
        onChange={handleToggle}
        size="small"
      />
    </div>
  );
};

export default memo(FillCapsBlock);
