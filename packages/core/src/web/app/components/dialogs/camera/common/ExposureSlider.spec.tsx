/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import ExposureSlider from './ExposureSlider';

jest.mock('antd', () => ({
  Slider: ({ className, min, max, step, value, onChange, onAfterChange }: any) => (
    <div className={className}>
      <h1>Mock Slider</h1>
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <input onChange={(e) => onChange(Number(e.target.value))} value={value} />
      <button type="button" onClick={() => onAfterChange(87)}>
        Mock After Change
      </button>
    </div>
  ),
  Tooltip: ({ title, children }: any) => <div title={title}>{children}</div>,
}));

const mockSetDeviceSetting = jest.fn();
jest.mock('helpers/device-master', () => ({
  setDeviceSetting: (...args) => mockSetDeviceSetting(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  editor: {
    exposure: 'exposure',
  },
}));

const mockExposureSetting = {
  min: 250,
  max: 650,
  step: 1,
  value: 300,
};

const mockOnChanged = jest.fn();
const mockSetExposureSetting = jest.fn();

describe('test ExposureSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <ExposureSlider
        className="test-class"
        exposureSetting={mockExposureSetting}
        setExposureSetting={mockSetExposureSetting}
        onChanged={mockOnChanged}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('onAfterChange', async () => {
    const { getByText } = render(
      <ExposureSlider
        className="test-class"
        exposureSetting={mockExposureSetting}
        setExposureSetting={mockSetExposureSetting}
        onChanged={mockOnChanged}
      />
    );
    expect(mockOpenNonstopProgress).not.toBeCalled();
    expect(mockSetDeviceSetting).not.toBeCalled();
    expect(mockOnChanged).not.toBeCalled();
    await act(() => fireEvent.click(getByText('Mock After Change')));
    expect(mockOpenNonstopProgress).toBeCalledTimes(1);
    expect(mockSetDeviceSetting).toBeCalledTimes(1);
    expect(mockSetDeviceSetting).toBeCalledWith('camera_exposure_absolute', '87');
    expect(mockOnChanged).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledTimes(1);
  });

  test('onChange', async () => {
    const { container } = render(
      <ExposureSlider
        className="test-class"
        exposureSetting={mockExposureSetting}
        setExposureSetting={mockSetExposureSetting}
        onChanged={mockOnChanged}
      />
    );
    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input).toHaveProperty('value', '300');
    await act(() => fireEvent.change(input as Element, { target: { value: '87' } }));
    expect(mockSetExposureSetting).toBeCalledTimes(1);
    expect(mockSetExposureSetting).toBeCalledWith({ ...mockExposureSetting, value: 87 });
  });
});
