import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import PrintingInputs from './PrintingInputs';

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

jest.mock('helpers/layer/layer-config-helper', () => ({
  baseConfig: {
    ink: 3,
    multipass: 3,
    speed: 60,
    cRatio: 100,
    mRatio: 100,
    yRatio: 100,
    kRatio: 100,
    repeat: 1,
    halftone: 1,
  },
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        ink_saturation: 'ink_saturation',
        halftone: 'halftone',
        speed: 'speed',
        print_multipass: 'print_multipass',
        times: 'times',
        repeat: 'repeat',
        slider: {
          very_low: 'very_low',
          low: 'low',
          regular: 'regular',
          high: 'high',
          very_high: 'very_high',
          very_slow: 'very_slow',
          slow: 'slow',
          fast: 'fast',
          very_fast: 'very_fast',
        },
      },
    },
  },
}));

describe('PrintingInputs', () => {
  const handleChange = jest.fn();
  const preset = {
    ink: 3,
    multipass: 3,
    speed: 60,
    isDefault: false,
  };
  const maxSpeed = 100;
  const minSpeed = 0;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly in simple mode', () => {
    const { container } = render(
      <PrintingInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('change value in simple mode', () => {
    const { baseElement } = render(
      <PrintingInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    const inkToggle = baseElement.querySelector('#inkSelect');
    fireEvent.mouseDown(inkToggle);
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[0]
    );
    expect(handleChange).toBeCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('ink', 1);
    const halftoneToggle = baseElement.querySelector('#halftoneSelect');
    fireEvent.mouseDown(halftoneToggle);
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[1]
    );
    expect(handleChange).toBeCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith('halftone', 2);
  });

  it('should render correctly in advanced mode', () => {
    mockRead.mockReturnValue(true);
    const { container } = render(
      <PrintingInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('change value in advanced mode', () => {
    mockRead.mockReturnValue(true);
    const { getByTestId } = render(
      <PrintingInputs
        preset={preset}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        handleChange={handleChange}
      />
    );
    const inkInput = getByTestId('ink');
    fireEvent.change(inkInput, { target: { value: 2 } });
    expect(handleChange).toBeCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('ink', 2);
    const cRatioInput = getByTestId('cRatio');
    fireEvent.change(cRatioInput, { target: { value: 2 } });
    expect(handleChange).toBeCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith('cRatio', 2);
    const speedInput = getByTestId('speed');
    fireEvent.change(speedInput, { target: { value: 50 } });
    expect(handleChange).toBeCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('speed', 50);
    const multipassInput = getByTestId('multipass');
    fireEvent.change(multipassInput, { target: { value: 2 } });
    expect(handleChange).toBeCalledTimes(4);
    expect(handleChange).toHaveBeenLastCalledWith('multipass', 2);
  });
});
