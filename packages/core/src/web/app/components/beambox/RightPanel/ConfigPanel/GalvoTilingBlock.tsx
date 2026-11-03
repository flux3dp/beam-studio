import React, { memo, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import type { GalvoTilingType } from '@core/app/constants/galvo-tiling';
import { GalvoTiling } from '@core/app/constants/galvo-tiling';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './GalvoTilingBlock.module.scss';
import initState from './initState';

/** How a HEXA G galvo layer is divided between gantry stops. */
const GalvoTilingBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel.galvo_tiling;
  const { change, galvoTiling } = useConfigPanelStore(useShallow(pick(['galvoTiling', 'change'])));
  const options = useMemo(
    () => [
      { label: t.grid, value: GalvoTiling.Grid },
      { label: t.object, value: GalvoTiling.Object },
    ],
    [t],
  );

  const handleChange = (value: GalvoTilingType) => {
    if (!galvoTiling.hasMultiValue && value === galvoTiling.value) return;

    change({ galvoTiling: value });

    // the modal writes every changed key itself when it is saved
    if (type === 'modal') return;

    eventEmitterFactory.createEventEmitter('time-estimation-button').emit('SET_ESTIMATED_TIME', null);

    const batchCmd = new history.BatchCommand('Change galvo tiling');

    layerManager.getSelectedLayers().forEach((layerName) => {
      writeData(layerName, 'galvoTiling', value, { batchCmd });
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
  };

  if (type === 'panel-item') {
    return (
      <ObjectPanelItem.Select
        id="galvo-tiling"
        label={t.title}
        onChange={handleChange}
        options={options}
        selected={galvoTiling.hasMultiValue ? undefined : options.find(({ value }) => value === galvoTiling.value)}
      />
    );
  }

  return (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>
        {t.title}
        <Tooltip title={t.object_hint}>
          <QuestionCircleOutlined />
        </Tooltip>
      </span>
      <Select
        className={styles.select}
        id="galvo-tiling-select"
        onChange={handleChange}
        options={options}
        placeholder="-"
        value={galvoTiling.hasMultiValue ? undefined : galvoTiling.value}
      />
    </div>
  );
};

export default memo(GalvoTilingBlock);
