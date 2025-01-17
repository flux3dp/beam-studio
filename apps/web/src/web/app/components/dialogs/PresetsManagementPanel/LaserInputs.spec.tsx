import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import LaserInputs from './LaserInputs';

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        strength: 'strength',
        speed: 'speed',
        repeat: 'repeat',
        times: 'times',
        z_step: 'z_step',
        preset_management: {
          lower_focus_by: 'lower_focus_by',
        },
      },
    },
  },
}));

jest.mock('helpers/layer/layer-config-helper', () => ({
  baseConfig: {
    power: 15,
    speed: 20,
    repeat: 1,
    focus: -2,
    focusStep: -2,
  },
}));

describe('LaserInputs', () => {
  const handleChange = jest.fn();
  const preset = {
    power: 100,
    speed: 100,
    isDefault: false,
  };
  const maxSpeed = 100;
  const minSpeed = 0;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <LaserInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should call handleChange when input value changes', () => {
    const { getByTestId } = render(
      <LaserInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    const powerInput = getByTestId('power');
    fireEvent.change(powerInput, { target: { value: '50' } });
    expect(handleChange).toBeCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('power', 50);
    const speedInput = getByTestId('speed');
    fireEvent.change(speedInput, { target: { value: '50' } });
    expect(handleChange).toBeCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith('speed', 50);
    const repeatInput = getByTestId('repeat');
    fireEvent.change(repeatInput, { target: { value: '50' } });
    expect(handleChange).toBeCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('repeat', 50);
    const focusStepInput = getByTestId('focusStep');
    fireEvent.change(focusStepInput, { target: { value: '50' } });
    // both focusStep and zStep should be updated
    expect(handleChange).toBeCalledTimes(5);
    expect(handleChange).toHaveBeenLastCalledWith('focusStep', 50);
  });
});
