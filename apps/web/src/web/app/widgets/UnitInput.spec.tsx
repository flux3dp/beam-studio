import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import UnitInput from './UnitInput';

const mockOnChange = jest.fn();

describe('test UnitInput', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render correctly', () => {
    const { container } = render(<UnitInput id="test" value={0} unit="mm" underline />);
    expect(container).toMatchSnapshot();
  });

  test('onChange without fireOnChage', () => {
    const { container } = render(<UnitInput id="test" value={0} onChange={mockOnChange} />);
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '1' } });
    expect(mockOnChange).not.toBeCalled();
    fireEvent.blur(input);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toBeCalledWith(1);
  });

  test('onChange with fireOnChage', () => {
    const { container } = render(
      <UnitInput id="test" value={0} onChange={mockOnChange} fireOnChange />
    );
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '1' } });
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toBeCalledWith(1);
  });

  test('inch conversion', () => {
    const { container } = render(
      <UnitInput id="test" value={25.4} onChange={mockOnChange} isInch precision={0} />
    );
    const input = container.querySelector('input');
    expect(input).toHaveValue('1');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toBeCalledWith(50.8);
  });

  test('clip min', () => {
    const { container } = render(
      <UnitInput id="test" value={0} onChange={mockOnChange} min={10} clipValue />
    );
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.blur(input);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toBeCalledWith(10);
  });

  test('clip max', () => {
    const { container } = render(
      <UnitInput id="test" value={0} onChange={mockOnChange} max={10} clipValue />
    );
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '11' } });
    fireEvent.blur(input);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toBeCalledWith(10);
  });
});
