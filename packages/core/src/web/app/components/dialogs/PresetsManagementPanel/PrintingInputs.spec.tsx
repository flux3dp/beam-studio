import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import PrintingInputs from './PrintingInputs';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockUseGlobalPreferenceStore = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: (...args) => mockUseGlobalPreferenceStore(...args),
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  baseConfig: {
    cRatio: 100,
    halftone: 1,
    ink: 3,
    kRatio: 100,
    mRatio: 100,
    multipass: 3,
    repeat: 1,
    speed: 60,
    yRatio: 100,
  },
}));

describe('PrintingInputs', () => {
  const handleChange = jest.fn();
  const preset = {
    ink: 3,
    isDefault: false,
    multipass: 3,
    speed: 60,
  };
  const maxSpeed = 100;
  const minSpeed = 0;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly in simple mode', () => {
    const { container } = render(
      <PrintingInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly for 4c printer module', () => {
    const { container } = render(
      <PrintingInputs
        handleChange={handleChange}
        maxSpeed={maxSpeed}
        minSpeed={minSpeed}
        preset={{ ...preset, module: LayerModule.PRINTER_4C }}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('change value in simple mode', () => {
    const { baseElement } = render(
      <PrintingInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );
    const inkToggle = baseElement.querySelector('#inkSelect');

    fireEvent.mouseDown(inkToggle);
    fireEvent.click(baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[0]);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('ink', 1);

    const halftoneToggle = baseElement.querySelector('#halftoneSelect');

    fireEvent.mouseDown(halftoneToggle);
    fireEvent.click(baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[1]);
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith('halftone', 2);
  });

  it('should render correctly in advanced mode', () => {
    mockUseGlobalPreferenceStore.mockReturnValue(true);

    const { container } = render(
      <PrintingInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );

    expect(container).toMatchSnapshot();
  });

  test('change value in advanced mode', () => {
    mockUseGlobalPreferenceStore.mockReturnValue(true);

    const { getByTestId } = render(
      <PrintingInputs handleChange={handleChange} maxSpeed={maxSpeed} minSpeed={minSpeed} preset={preset} />,
    );
    const inkInput = getByTestId('ink');

    fireEvent.change(inkInput, { target: { value: 2 } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith('ink', 2);

    const cRatioInput = getByTestId('cRatio');

    fireEvent.change(cRatioInput, { target: { value: 2 } });
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith('cRatio', 2);

    const speedInput = getByTestId('speed');

    fireEvent.change(speedInput, { target: { value: 50 } });
    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('speed', 50);

    const multipassInput = getByTestId('multipass');

    fireEvent.change(multipassInput, { target: { value: 2 } });
    expect(handleChange).toHaveBeenCalledTimes(4);
    expect(handleChange).toHaveBeenLastCalledWith('multipass', 2);
  });
});
