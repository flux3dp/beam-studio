import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import LaserInputs from './LaserInputs';

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        preset_management: {
          lower_focus_by: 'lower_focus_by',
        },
        repeat: 'repeat',
        speed: 'speed',
        strength: 'strength',
        times: 'times',
        z_step: 'z_step',
      },
    },
  },
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  baseConfig: {
    focus: -2,
    focusStep: -2,
    power: 15,
    repeat: 1,
    speed: 20,
  },
}));

describe('LaserInputs', () => {
  const handleChange = jest.fn();
  const preset = {
    isDefault: false,
    power: 100,
    speed: 100,
  };
  const maxSpeed = 100;
  const minSpeed = 0;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <LaserInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call handleChange when input value changes', () => {
    const { getByTestId } = render(
      <LaserInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );
    const powerInput = getByTestId('power');

    fireEvent.change(powerInput, { target: { value: '50' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('power', 50);

    const speedInput = getByTestId('speed');

    fireEvent.change(speedInput, { target: { value: '50' } });
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith('speed', 50);

    const repeatInput = getByTestId('repeat');

    fireEvent.change(repeatInput, { target: { value: '50' } });
    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('repeat', 50);

    const focusStepInput = getByTestId('focusStep');

    fireEvent.change(focusStepInput, { target: { value: '50' } });
    // both focusStep and zStep should be updated
    expect(handleChange).toHaveBeenCalledTimes(5);
    expect(handleChange).toHaveBeenLastCalledWith('focusStep', 50);
  });
});
