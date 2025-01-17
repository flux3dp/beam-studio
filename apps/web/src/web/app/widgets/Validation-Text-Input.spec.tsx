import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import keyCodeConstants from 'app/constants/keycode-constants';

import ValidationTextInput from './Validation-Text-Input';

describe('test Validation-Text-Input', () => {
  test('should render correctly', () => {
    const { container } = render(
      <ValidationTextInput defaultValue="123" validation={jest.fn()} getValue={jest.fn()} />
    );
    expect(container).toMatchSnapshot();
  });

  test('test onBlur', () => {
    const mockValidation = jest.fn();
    const mockGetValue = jest.fn();
    const { container } = render(
      <ValidationTextInput defaultValue="123" validation={mockValidation} getValue={mockGetValue} />
    );
    const input = container.querySelector('input');
    expect(input).toHaveValue('123');

    mockValidation.mockReturnValue('789');
    input.value = '456';
    fireEvent.blur(input);
    expect(mockValidation).toHaveBeenCalledTimes(1);
    expect(mockValidation).toHaveBeenNthCalledWith(1, '456');
    expect(input).toHaveValue('789');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenNthCalledWith(1, '789');

    mockValidation.mockReturnValue('');
    input.value = '456';
    fireEvent.blur(input);
    expect(mockValidation).toHaveBeenCalledTimes(2);
    expect(mockValidation).toHaveBeenNthCalledWith(2, '456');
    expect(input).toHaveValue('');
    expect(mockGetValue).toHaveBeenCalledTimes(2);
    expect(mockGetValue).toHaveBeenNthCalledWith(2, '');

    mockValidation.mockReturnValue(null);
    input.value = '456';
    fireEvent.blur(input);
    expect(mockValidation).toHaveBeenCalledTimes(3);
    expect(mockValidation).toHaveBeenNthCalledWith(3, '456');
    expect(input).toHaveValue('');
    expect(mockGetValue).toHaveBeenCalledTimes(2);
  });

  test('test onKeyDown', () => {
    const mockValidation = jest.fn();
    const mockGetValue = jest.fn();
    const { container } = render(
      <ValidationTextInput defaultValue="123" validation={mockValidation} getValue={mockGetValue} />
    );
    const input = container.querySelector('input');
    expect(input).toHaveValue('123');

    input.value = '456';

    mockValidation.mockReturnValue('789');
    fireEvent.keyDown(input, {
      keyCode: keyCodeConstants.KEY_RETURN,
    });
    expect(mockValidation).toHaveBeenCalledTimes(1);
    expect(mockValidation).toHaveBeenNthCalledWith(1, '456');
    expect(input).toHaveValue('789');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenNthCalledWith(1, '789');

    fireEvent.keyDown(input, {
      keyCode: keyCodeConstants.KEY_ESC,
    });
    expect(input).toHaveValue('789');
  });
});
