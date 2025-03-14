import React from 'react';

import units from '@core/helpers/units';

import styles from './ProgressBar.module.scss';

interface Props {
  handleSimTimeChange: (value: number) => void;
  simTime: number;
  simTimeMax: number;
}

function ProgressBar({ handleSimTimeChange, simTime, simTimeMax }: Props): React.JSX.Element {
  const percentage = `${Math.round(10000 * (simTime / simTimeMax)) / 100}%`;

  return (
    <div className={styles.container} id="progress-bar">
      <input
        className="slider"
        max={units.convertTimeUnit(simTimeMax, 'ms', 'm')}
        min={0}
        onChange={(e) => handleSimTimeChange(units.convertTimeUnit(Number(e.target.value), 'm', 'ms'))}
        step={units.convertTimeUnit(0.1, 'ms')}
        style={{
          // @ts-ignore Set variable for css to use
          '--percentage': percentage,
        }}
        type="range"
        value={units.convertTimeUnit(simTime, 'ms', 'm')}
      />
    </div>
  );
}

export default ProgressBar;
