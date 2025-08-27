import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import ExposureSlider from './ExposureSlider';

jest.mock('antd', () => ({
  Slider: ({ className, max, min, onChange, onChangeComplete, step, value }: any) => (
    <div className={className}>
      <h1>Mock Slider</h1>
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <input onChange={(e) => onChange(Number(e.target.value))} value={value} />
      <button onClick={() => onChangeComplete(87)} type="button">
        Mock Change Complete
      </button>
    </div>
  ),
  Tooltip: ({ children, title }: any) => <div title={title}>{children}</div>,
}));

const mockSetExposure = jest.fn();

jest.mock('@core/helpers/device/camera/cameraExposure', () => ({
  setExposure: (...args) => mockSetExposure(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  editor: {
    exposure: 'exposure',
  },
}));

const mockExposureSetting = {
  max: 650,
  min: 250,
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
        onChanged={mockOnChanged}
        setExposureSetting={mockSetExposureSetting}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChangeComplete', async () => {
    const { getByText } = render(
      <ExposureSlider
        className="test-class"
        exposureSetting={mockExposureSetting}
        onChanged={mockOnChanged}
        setExposureSetting={mockSetExposureSetting}
      />,
    );

    expect(mockOpenNonstopProgress).not.toHaveBeenCalled();
    expect(mockSetExposure).not.toHaveBeenCalled();
    expect(mockOnChanged).not.toHaveBeenCalled();
    await act(() => fireEvent.click(getByText('Mock Change Complete')));
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockSetExposure).toHaveBeenCalledTimes(1);
    expect(mockSetExposure).toHaveBeenCalledWith(87);
    expect(mockOnChanged).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledTimes(1);
  });

  test('onChange', async () => {
    const { container } = render(
      <ExposureSlider
        className="test-class"
        exposureSetting={mockExposureSetting}
        onChanged={mockOnChanged}
        setExposureSetting={mockSetExposureSetting}
      />,
    );
    const input = container.querySelector('input');

    expect(input).not.toBeNull();
    expect(input).toHaveProperty('value', '300');
    await act(() => fireEvent.change(input as Element, { target: { value: '87' } }));
    expect(mockSetExposureSetting).toHaveBeenCalledTimes(1);
    expect(mockSetExposureSetting).toHaveBeenCalledWith({ ...mockExposureSetting, value: 87 });
  });
});
