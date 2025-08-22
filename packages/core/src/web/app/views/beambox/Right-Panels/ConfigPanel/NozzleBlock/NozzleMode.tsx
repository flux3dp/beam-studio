import { memo, useContext } from 'react';

import classNames from 'classnames';
import { useShallow } from 'zustand/react/shallow';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import { writeData } from '@core/helpers/layer/layer-config-helper';

import styles from '../Block.module.scss';
import ConfigPanelContext from '../ConfigPanelContext';
import initState from '../initState';

const NozzleMode = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }) => {
  const { selectedLayers } = useContext(ConfigPanelContext);
  const { change, nozzleMode } = useConfigPanelStore(
    useShallow((state) => ({
      change: state.change,
      nozzleMode: state.nozzleMode,
    })),
  );

  const handleChange = (value: number) => {
    if (value === nozzleMode.value) {
      return;
    }

    change({ nozzleMode: value });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Nozzle Mode');

      selectedLayers.forEach((layerName) => writeData(layerName, 'nozzleMode', value, { batchCmd }));
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const { hasMultiValue, value } = nozzleMode;

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
