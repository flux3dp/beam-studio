import { memo } from 'react';

import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import { writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import initState from '../initState';

const NozzleMode = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }) => {
  const { change, nozzleMode } = useConfigPanelStore(useShallow((state) => pick(state, ['change', 'nozzleMode'])));

  const { hasMultiValue, value } = nozzleMode;
  const handleChange = (newValue: number) => {
    if (newValue === value && !hasMultiValue) {
      return;
    }

    change({ nozzleMode: newValue });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Nozzle Mode');

      useLayerStore
        .getState()
        .selectedLayers.forEach((layerName) => writeData(layerName, 'nozzleMode', newValue, { batchCmd }));
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const options = [
    { label: 'Left', value: 1 },
    { label: 'Right', value: 2 },
    { label: 'Both', value: 3 },
  ];

  return type === 'panel-item' ? (
    <ObjectPanelItem.Select
      id="nozzle-mode"
      label="Nozzle Mode"
      onChange={handleChange}
      options={options}
      selected={hasMultiValue ? { label: '-', value: 0 } : options[value - 1]}
    />
  ) : (
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
