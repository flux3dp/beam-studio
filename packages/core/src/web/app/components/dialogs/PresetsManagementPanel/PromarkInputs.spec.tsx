import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import PromarkInputs from './PromarkInputs';

const handleChange = jest.fn();
const preset = {
  power: 100,
  speed: 100,
  repeat: 1,
  focus: 0,
  focusStep: 1,
  pulseWidth: 100,
  frequency: 30,
  fillInterval: 0.1,
  fillAngle: 0,
  biDirectional: true,
  crossHatch: false,
  dottingTime: 100,
  isDefault: false,
};
const maxSpeed = 100;
const minSpeed = 0.1;

const inputTests = [
  { key: 'power', value: 10 },
  { key: 'speed', value: 10 },
  { key: 'repeat', value: 10 },
  { key: 'focus', value: 10 },
  { key: 'focusStep', value: 0.1 },
  { key: 'pulseWidth', value: 110 },
  { key: 'frequency', value: 32 },
  { key: 'fillInterval', value: 0.2 },
  { key: 'fillAngle', value: 10 },
  { key: 'dottingTime', value: 150 },
];

const switchTests = [
  { key: 'biDirectional', value: false },
  { key: 'crossHatch', value: true },
];

jest.mock('helpers/layer/layer-config-helper', () => ({
  getPromarkLimit: () => ({
    pulseWidth: { min: 2, max: 350 },
    frequency: { min: 1, max: 4000 },
  }),
  getDefaultConfig: () => ({}),
}));

describe('PromarkInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <PromarkInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it.each(inputTests)('should call handleChange when $key value changes', ({ key, value }) => {
    const { getByTestId } = render(
      <PromarkInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    const input = getByTestId(key);
    fireEvent.change(input, { target: { value } });
    expect(handleChange).toBeCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(key, value);
  });

  it.each(switchTests)('should call handleChange when $key value changes', ({ key, value }) => {
    const { getByTestId } = render(
      <PromarkInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    const input = getByTestId(key);
    fireEvent.click(input);
    expect(handleChange).toBeCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(key, value);
  });
});
