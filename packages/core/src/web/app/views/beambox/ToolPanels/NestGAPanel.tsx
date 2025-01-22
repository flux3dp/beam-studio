import React from 'react';

import UnitInput from '@core/app/widgets/Unit-Input-v2';

interface Props {
  nestOptions: {
    generations: number;
    population: number;
  };
  updateNestOptions: (options: { generations?: number; population?: number }) => void;
}

function NestGAPanel({ nestOptions, updateNestOptions }: Props): React.JSX.Element {
  const [generations, updateGenerations] = React.useState(nestOptions.generations);
  const [population, updatePopulation] = React.useState(nestOptions.population);

  const updateGen = (val: number) => {
    updateNestOptions({ generations: val });
    updateGenerations(val);
  };

  const updatePopu = (val: number) => {
    updateNestOptions({ population: val });
    updatePopulation(val);
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption">
          GA
          <span className="value">{`G${generations}, P${population}`}</span>
        </p>
        <label className="accordion-body">
          <div>
            <span className="text-center header">Generations</span>
            <div className="control">
              <UnitInput decimal={0} defaultValue={generations} getValue={updateGen} min={1} unit="" />
            </div>
            <span className="text-center header">Population</span>
            <div className="control">
              <UnitInput decimal={0} defaultValue={population} getValue={updatePopu} min={2} unit="" />
            </div>
          </div>
        </label>
      </label>
    </div>
  );
}

export default NestGAPanel;
