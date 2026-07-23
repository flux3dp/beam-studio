import { memo } from 'react';

import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import Select from '@core/app/widgets/AntdSelect';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import type { CommonProps } from '@core/interfaces/ConfigOption';

import styles from '../Block.module.scss';
import initState from '../initState';

const NozzleMode = ({ noApply }: CommonProps) => {
  const { change, nozzleMode } = useConfigPanelStore(useShallow((state) => pick(state, ['change', 'nozzleMode'])));

  const { hasMultiValue, value } = nozzleMode;
  const handleChange = (newValue: number) => {
    if (newValue === value && !hasMultiValue) {
      return;
    }

    change({ nozzleMode: newValue });

    if (!noApply) {
      const batchCmd = new history.BatchCommand('Change Nozzle Mode');

      useLayerStore
        .getState()
        .selectedLayers.forEach((layerName) => writeData(layerName, 'nozzleMode', newValue, { batchCmd }));
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  return (
    <div className={classNames(styles.panel)}>
      <span className={styles.title}>Nozzle Mode</span>
      <Select
        className={styles['inline-select']}
        onChange={handleChange}
        options={[
          { label: 'Left', value: 1 },
          { label: 'Right', value: 2 },
          { label: 'Both', value: 3 },
        ]}
        value={hasMultiValue ? '-' : value}
      />
    </div>
  );
};

export default memo(NozzleMode);
