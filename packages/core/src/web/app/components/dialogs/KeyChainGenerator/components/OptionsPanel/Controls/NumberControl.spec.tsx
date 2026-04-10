import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('antd', () => ({
  Slider: ({ max, min, onChange, step, value }: any) => (
    <input
      data-testid="slider"
      max={max}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      step={step}
      type="range"
      value={value}
    />
  ),
}));

import NumberControl from './NumberControl';

describe('NumberControl', () => {
  const defaultProps = {
    defaultValue: 5,
    label: 'Diameter',
    max: 10,
    min: 1,
    onChange: jest.fn(),
    step: 0.5,
    unit: 'mm',
    value: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render label and value', () => {
    const { getByText } = render(<NumberControl {...defaultProps} />);

    expect(getByText('Diameter')).toBeInTheDocument();
  });

  it('should not show reset button when value equals default', () => {
    const { queryByTitle } = render(<NumberControl {...defaultProps} />);

    expect(queryByTitle('Reset to default')).not.toBeInTheDocument();
  });

  it('should show reset button when value differs from default', () => {
    const { getByTitle } = render(<NumberControl {...defaultProps} value={7} />);

    expect(getByTitle('Reset to default')).toBeInTheDocument();
  });

  it('should call onChange with defaultValue when reset button is clicked', () => {
    const { getByTitle } = render(<NumberControl {...defaultProps} value={7} />);

    fireEvent.click(getByTitle('Reset to default'));
    expect(defaultProps.onChange).toHaveBeenCalledWith(5);
  });

  it('should call onChange when UnitInput value changes', () => {
    const { container } = render(<NumberControl {...defaultProps} />);
    const input = container.querySelector('input[value="5"]') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '8' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(8);
  });

  it('should render slider by default', () => {
    const { getByTestId } = render(<NumberControl {...defaultProps} />);

    expect(getByTestId('slider')).toBeInTheDocument();
  });

  it('should call onChange when slider changes', () => {
    const { getByTestId } = render(<NumberControl {...defaultProps} />);

    fireEvent.change(getByTestId('slider'), { target: { value: '3' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(3);
  });

  it('should hide slider when withSlider is false', () => {
    const { queryByTestId } = render(<NumberControl {...defaultProps} withSlider={false} />);

    expect(queryByTestId('slider')).not.toBeInTheDocument();
  });

  it('should render unit via UnitInput addonAfter', () => {
    const { getByText } = render(<NumberControl {...defaultProps} />);

    expect(getByText('addonAfter: mm')).toBeInTheDocument();
  });
});
