import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SwitchControl from './Switch-Control';

describe('test Switch-Control', () => {
  test('should render correctly', () => {
    const mockOnChange = jest.fn();
    const { container, getByRole } = render(
      <SwitchControl
        id="abc"
        name="rotary_mode"
        label="Work Area"
        onText="Enable"
        offText="Disable"
        default
        onChange={mockOnChange}
      />
    );
    expect(container).toMatchSnapshot();

    const input = container.querySelector('input#abc');
    expect(input).toBeChecked();

    fireEvent.click(getByRole('checkbox'));
    expect(container).toMatchSnapshot();
    expect(input).not.toBeChecked();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, false);
  });

  test('should render correctly if disabled', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <SwitchControl
        id="abc"
        name="rotary_mode"
        label="Work Area"
        isDisabled
        default
        onChange={mockOnChange}
      />
    );
    expect(container).toMatchSnapshot();

    const input = container.querySelector('input#abc');
    expect(input).toBeChecked();

    fireEvent.click(input);
    expect(input).toBeChecked();
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
