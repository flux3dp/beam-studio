import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigValueDisplay from './ConfigValueDisplay';

describe('test ConfigValueDisplay when type is not panel-item', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={() => {}}
        type="default"
        unit="mm"
        value={5}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={mockOnChange}
        type="default"
        unit="mm"
        value={5}
      />,
    );
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '7' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 7);
  });
});

describe('test ConfigValueDisplay when type is panel-item', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={() => {}}
        type="panel-item"
        unit="mm"
        value={5}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={mockOnChange}
        type="panel-item"
        unit="mm"
        value={5}
      />,
    );
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '7' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 7);
  });
});
