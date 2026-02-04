import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import UnitInput from './UnitInput';

const mockOnChange = jest.fn();

describe('test UnitInput', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render correctly', () => {
    const { container } = render(<UnitInput id="test" underline unit="mm" value={0} />);

    expect(container).toMatchSnapshot();
  });

  test('onChange without fireOnChage', () => {
    const { container } = render(<UnitInput id="test" onChange={mockOnChange} value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '1' } });
    expect(mockOnChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  test('onChange with fireOnChage', () => {
    const { container } = render(<UnitInput fireOnChange id="test" onChange={mockOnChange} value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '1' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  test('inch conversion', () => {
    const { container } = render(<UnitInput id="test" isInch onChange={mockOnChange} precision={0} value={25.4} />);
    const input = container.querySelector('input');

    expect(input).toHaveValue('1');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(50.8);
  });

  test('clip min', () => {
    const { container } = render(<UnitInput clipValue id="test" min={10} onChange={mockOnChange} value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  test('clip max', () => {
    const { container } = render(<UnitInput clipValue id="test" max={10} onChange={mockOnChange} value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '11' } });
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(10);
  });
});
