// for mock components props
import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigSlider from './ConfigSlider';

const MOCK_CHANGE_VALUE = 88;
const MOCK_AFTER_CHANGE_VALUE = 87;

jest.mock('antd', () => ({
  ConfigProvider: ({ children, theme }: any) => (
    <div>
      Mock Antd ConfigProvider<p>theme: {JSON.stringify(theme)}</p>
      {children}
    </div>
  ),
  Slider: ({ max, min, onChange, onChangeComplete, step, value }: any) => (
    <div>
      Mock Antd Slider
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <p>value: {value}</p>
      <button onClick={() => onChangeComplete(MOCK_AFTER_CHANGE_VALUE)} type="button">
        onChangeComplete
      </button>
      <button onClick={() => onChange(MOCK_CHANGE_VALUE)} type="button">
        onChange
      </button>
    </div>
  ),
}));

const mockPropOnChange = jest.fn();

describe('test ConfigSlider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should work', () => {
    const { container, getByText, rerender } = render(
      <ConfigSlider id="mock-id" max={100} min={0} onChange={mockPropOnChange} step={1} value={10} />,
    );

    expect(container).toMatchSnapshot();
    rerender(
      <ConfigSlider
        id="mock-id"
        max={100}
        min={0}
        onChange={mockPropOnChange}
        step={1}
        value={7}
        warningPercent={50}
      />,
    );
    expect(container).toMatchSnapshot();
    expect(getByText('value: 7')).toBeInTheDocument();
    fireEvent.click(getByText('onChange'));
    expect(container).toMatchSnapshot();
    expect(getByText(`value: ${MOCK_CHANGE_VALUE}`)).toBeInTheDocument();
    expect(mockPropOnChange).not.toBeCalled();
    fireEvent.click(getByText('onChangeComplete'));
    expect(mockPropOnChange).toBeCalledTimes(1);
    expect(mockPropOnChange).toHaveBeenLastCalledWith(MOCK_AFTER_CHANGE_VALUE);
  });

  it('should render correctly when isGradient is true', () => {
    const { container } = render(
      <ConfigSlider id="mock-id" isGradient max={100} min={0} onChange={mockPropOnChange} step={1} value={10} />,
    );

    expect(container).toMatchSnapshot();
  });
});
