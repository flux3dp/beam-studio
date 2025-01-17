import React from 'react';

import UnitInput from 'app/widgets/Unit-Input-v2';

interface Props {
  nestOptions: {
    generations: number,
    population: number,
  }
  updateNestOptions: (options: {
    generations?: number,
    population?: number,
  }) => void,
}

function NestGAPanel({ nestOptions, updateNestOptions }: Props): JSX.Element {
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
        <input type="checkbox" className="accordion-switcher" defaultChecked />
        <p className="caption">
          GA
          <span className="value">{`G${generations}, P${population}`}</span>
        </p>
        <label className="accordion-body">
          <div>
            <span className="text-center header">Generations</span>
            <div className="control">
              <UnitInput
                min={1}
                unit=""
                decimal={0}
                defaultValue={generations}
                getValue={updateGen}
              />
            </div>
            <span className="text-center header">Population</span>
            <div className="control">
              <UnitInput
                min={2}
                unit=""
                decimal={0}
                defaultValue={population}
                getValue={updatePopu}
              />
            </div>
          </div>
        </label>
      </label>
    </div>
  );
}

export default NestGAPanel;
