import React from 'react';

import units from 'helpers/units';

interface Props {
  simTime: number;
  simTimeMax: number;
  handleSimTimeChange: (value: number) => void;
}

function ProgressBar({ simTime, simTimeMax, handleSimTimeChange }: Props): JSX.Element {
  const percentage = `${Math.round(10000 * (simTime / simTimeMax)) / 100}%`;
  return (
    <div>
      <div className="label pull-left" />
      <div id="progress-bar" className="path-preview-slider-container">
        <input
          className="slider"
          type="range"
          min={0}
          max={units.convertTimeUnit(simTimeMax, 'ms', 'm')}
          step={units.convertTimeUnit(0.1, 'ms')}
          value={units.convertTimeUnit(simTime, 'ms', 'm')}
          style={{
            // @ts-ignore Set variable for css to use
            '--percentage': percentage,
          }}
          onChange={(e) => handleSimTimeChange(units.convertTimeUnit(Number(e.target.value), 'm', 'ms'))}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
