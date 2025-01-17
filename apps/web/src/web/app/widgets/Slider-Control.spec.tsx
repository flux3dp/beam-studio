import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SliderControl from './Slider-Control';

describe('test Slider-Control', () => {
  test('should render correctly', () => {
    const { container } = render(
      <SliderControl
        id="abc"
        label="Threshold"
        min={0}
        max={100}
        step={2}
        default={0}
        onChange={jest.fn()}
        unit="cm"
        doOnlyOnMouseUp
        doOnlyOnBlur
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('should behave correctly with doOnlyOnMouseUp and doOnlyOnBlur', () => {
    const mockOnChange = jest.fn();
    const setState = jest.spyOn(SliderControl.prototype, 'setState');
    const { container } = render(
      <SliderControl
        id="abc"
        label="Threshold"
        min={0}
        max={100}
        step={2}
        default={0}
        onChange={mockOnChange}
        unit="cm"
        doOnlyOnMouseUp
        doOnlyOnBlur
      />
    );
    const [slider, input] = container.querySelectorAll('input');
    expect(input).toHaveValue('0');
    expect(slider).toHaveValue('0');

    fireEvent.change(slider, {
      target: {
        value: 1,
      },
    });
    expect(setState).toBeCalledTimes(1);
    expect(setState).toHaveBeenLastCalledWith(
      {
        inputValue: '1',
        lastValidValue: '1',
        sliderValue: '1',
      },
      expect.any(Function)
    );
    expect(mockOnChange).not.toHaveBeenCalled();

    fireEvent.mouseUp(slider, {
      target: {
        value: '2',
      },
    });
    expect(input).toHaveValue('1');
    expect(slider).toHaveValue('2');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'abc', '2');

    fireEvent.change(input, {
      target: {
        value: '3',
      },
    });
    expect(input).toHaveValue('3');
    expect(slider).toHaveValue('3');
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    fireEvent.focus(input, {
      target: {
        value: '',
      },
    });
    expect(input).toHaveValue('');
    expect(slider).toHaveValue('3');
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    fireEvent.blur(input, {
      target: {
        value: '4',
      },
    });
    expect(input).toHaveValue('4');
    expect(slider).toHaveValue('1');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('should behave correctly without doOnlyOnMouseUp and doOnlyOnBlur', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <SliderControl
        id="abc"
        label="Threshold"
        min={0}
        max={100}
        step={2}
        default={0}
        onChange={mockOnChange}
        unit="cm"
      />
    );
    const [slider, input] = container.querySelectorAll('input');
    expect(input).toHaveValue('0');
    expect(slider).toHaveValue('0');

    fireEvent.change(slider, {
      target: {
        value: 1,
      },
    });
    expect(input).toHaveValue('1');
    expect(slider).toHaveValue('1');
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'abc', '1');

    fireEvent.mouseUp(slider, {
      target: {
        value: '2',
      },
    });
    expect(input).toHaveValue('1');
    expect(slider).toHaveValue('2');
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    fireEvent.change(input, {
      target: {
        value: '',
      },
    });
    expect(input).toHaveValue('');
    expect(slider).toHaveValue('1');
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    fireEvent.focus(input, {
      target: {
        value: '3',
      },
    });
    expect(input).toHaveValue('3');
    expect(slider).toHaveValue('3');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'abc', '3');

    fireEvent.blur(input, {
      target: {
        value: '4',
      },
    });
    expect(input).toHaveValue('4');
    expect(slider).toHaveValue('3');
    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });
});
