import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import PromarkInputs from './PromarkInputs';

const handleChange = jest.fn();
const preset = {
  biDirectional: true,
  crossHatch: false,
  dottingTime: 100,
  fillAngle: 0,
  fillInterval: 0.1,
  focus: 0,
  focusStep: 1,
  frequency: 30,
  isDefault: false,
  power: 100,
  pulseWidth: 100,
  repeat: 1,
  speed: 100,
  wobbleDiameter: 0.2,
  wobbleStep: 0.01,
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
  { key: 'wobbleStep', value: 0.1 },
  { key: 'wobbleDiameter', value: 2 },
];

const switchTests = [
  { key: 'biDirectional', value: false },
  { key: 'crossHatch', value: true },
];

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => ({}),
  getPromarkLimit: () => ({
    frequency: { max: 4000, min: 1 },
    pulseWidth: { max: 350, min: 2 },
  }),
}));

describe('PromarkInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <PromarkInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );

    expect(container).toMatchSnapshot();
  });

  it.each(inputTests)('should call handleChange when $key value changes', ({ key, value }) => {
    const { getByTestId } = render(
      <PromarkInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );
    const input = getByTestId(key);

    fireEvent.change(input, { target: { value } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(key, value);
  });

  it.each(switchTests)('should call handleChange when $key value changes', ({ key, value }) => {
    const { getByTestId } = render(
      <PromarkInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );
    const input = getByTestId(key);

    fireEvent.click(input);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(key, value);
  });
});
