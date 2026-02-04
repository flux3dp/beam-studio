import React, { useState } from 'react';

import { fireEvent, render } from '@testing-library/react';

import ColorPickerMobile from './ColorPickerMobile';

jest.mock('@core/helpers/useI18n', () => () => ({
  alert: {
    cancel: 'Cancel',
    ok: 'OK',
  },
}));

const mockOnChange = jest.fn();
const mockOnClose = jest.fn();
const MockComponent = () => {
  const [color, setColor] = useState('#333333');

  return (
    <ColorPickerMobile
      color={color}
      onChange={(c, actual) => {
        mockOnChange(c, actual);
        setColor(c);
      }}
      onClose={mockOnClose}
      open
    />
  );
};

// Instead of moving across color picker palette,
// Use original hex input to trigger antd color picker onChange event
const mockSelectColor = (container: HTMLElement, color: string) => {
  const input = container.querySelector('.ant-color-picker-input input');

  fireEvent.change(input, { target: { value: color } });
};

describe('test ColorPickerMobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <ColorPickerMobile color="#333333" onChange={mockOnChange} onClose={mockOnClose} open />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly when closed', () => {
    const { baseElement } = render(
      <ColorPickerMobile color="#333333" onChange={mockOnChange} onClose={mockOnClose} open={false} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('preview and cancel', () => {
    const { container, getByText } = render(<MockComponent />);

    mockSelectColor(container, 'AAFFFF');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('#aaffff', false);
    fireEvent.click(getByText('Cancel'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('preview and ok', () => {
    const { container, getByText } = render(<MockComponent />);

    mockSelectColor(container, 'AAFFFF');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('#aaffff', false);
    fireEvent.click(getByText('OK'));
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenCalledWith('#aaffff', undefined);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('hex input', () => {
    const { container } = render(<MockComponent />);
    const input = container.querySelector('.footer .input input');

    fireEvent.change(input, { target: { value: 'aaaaff' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('#aaaaff', false);
    fireEvent.change(input, { target: { value: 'aaaaf' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveDisplayValue('aaaaf');
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('value', 'AAAAFF');
  });

  test('clear button', () => {
    const { container } = render(<MockComponent />);
    const claerBtn = container.querySelector('.clear-button>div');

    fireEvent.click(claerBtn);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('none', false);
  });
});
