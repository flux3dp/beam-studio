import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import { objectsColorPresets } from '@core/app/constants/color-constants';

import ColorPicker from './ColorPicker';

jest.mock('@core/helpers/useI18n', () => () => ({ alert: { cancel: 'cancel', ok: 'ok' } }));

const mockOnChange = jest.fn();

describe('test ColorPicker', () => {
  it('should render correctly', () => {
    const { baseElement } = render(
      <ColorPicker allowClear initColor="#ff0000" onChange={mockOnChange} triggerType="fill" />,
    );

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('.trigger'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly when initColor is none', () => {
    const { baseElement } = render(
      <ColorPicker allowClear initColor="none" onChange={mockOnChange} triggerType="fill" />,
    );

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('.trigger'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly when is small', () => {
    const { baseElement } = render(
      <ColorPicker allowClear initColor="#ff0000" onChange={mockOnChange} triggerSize="small" triggerType="fill" />,
    );

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('.trigger'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly when is for printing colors', () => {
    const { baseElement } = render(
      <ColorPicker allowClear colorPresets="cmykw" initColor="#ff0000" onChange={mockOnChange} triggerType="fill" />,
    );

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('.trigger'));
    expect(baseElement).toMatchSnapshot();
  });

  test('preset color and complete should work', () => {
    const { baseElement, container, getByText } = render(
      <ColorPicker allowClear initColor="#ff0000" onChange={mockOnChange} triggerType="fill" />,
    );

    fireEvent.click(baseElement.querySelector('.trigger'));
    fireEvent.click(baseElement.querySelectorAll('.preset-block')[1]);
    act(() => {
      fireEvent.click(getByText('ok'));
    });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, objectsColorPresets[0]);
    expect(container.querySelector('.trigger')).not.toHaveClass('open');
  });
});
