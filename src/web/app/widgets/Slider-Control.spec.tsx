import * as React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import SliderControl from './Slider-Control';

describe('test Slider-Control', () => {
  test('should render correctly', () => {
    const wrapper = mount(<SliderControl
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
    />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  test('should behave correctly with doOnlyOnMouseUp and doOnlyOnBlur', () => {
    const mockOnChange = jest.fn();
    const wrapper = mount(<SliderControl
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
    />);
    expect(wrapper.state().inputValue).toBe(0);
    expect(wrapper.state().sliderValue).toBe(0);
    expect(wrapper.state().lastValidValue).toBe(0);

    wrapper.find('input.slider').simulate('change', {
      target: {
        value: 1,
      },
    });
    expect(wrapper.state().inputValue).toBe(1);
    expect(wrapper.state().sliderValue).toBe(1);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).not.toHaveBeenCalled();

    wrapper.find('input.slider').simulate('mouseup', {
      target: {
        value: '2',
      },
    });
    expect(wrapper.state().inputValue).toBe(1);
    expect(wrapper.state().sliderValue).toBe(1);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'abc', '2');

    wrapper.find('input#abc').simulate('change', {
      target: {
        value: '3',
      },
    });
    expect(wrapper.state().inputValue).toBe('3');
    expect(wrapper.state().sliderValue).toBe(3);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    wrapper.find('input#abc').simulate('focus', {
      target: {
        value: '',
      },
    });
    expect(wrapper.state().inputValue).toBe('');
    expect(wrapper.state().sliderValue).toBe(3);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    wrapper.find('input#abc').simulate('blur', {
      target: {
        value: '4',
      },
    });
    expect(wrapper.state().inputValue).toBe(1);
    expect(wrapper.state().sliderValue).toBe(1);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    const mockStopPropagation = jest.fn();
    wrapper.find('input#abc').simulate('keydown', {
      stopPropagation: mockStopPropagation,
    });
    expect(mockStopPropagation).toHaveBeenCalledTimes(1);
  });

  test('should behave correctly without doOnlyOnMouseUp and doOnlyOnBlur', () => {
    const mockOnChange = jest.fn();
    const wrapper = mount(<SliderControl
      id="abc"
      label="Threshold"
      min={0}
      max={100}
      step={2}
      default={0}
      onChange={mockOnChange}
      unit="cm"
    />);
    expect(wrapper.state().inputValue).toBe(0);
    expect(wrapper.state().sliderValue).toBe(0);
    expect(wrapper.state().lastValidValue).toBe(0);

    wrapper.find('input.slider').simulate('change', {
      target: {
        value: 1,
      },
    });
    expect(wrapper.state().inputValue).toBe(1);
    expect(wrapper.state().sliderValue).toBe(1);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'abc', 1);

    wrapper.find('input.slider').simulate('mouseup', {
      target: {
        value: '2',
      },
    });
    expect(wrapper.state().inputValue).toBe(1);
    expect(wrapper.state().sliderValue).toBe(1);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    wrapper.find('input#abc').simulate('change', {
      target: {
        value: '',
      },
    });
    expect(wrapper.state().inputValue).toBe('');
    expect(wrapper.state().sliderValue).toBe(1);
    expect(wrapper.state().lastValidValue).toBe(1);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    wrapper.find('input#abc').simulate('focus', {
      target: {
        value: '3',
      },
    });
    expect(wrapper.state().inputValue).toBe('3');
    expect(wrapper.state().sliderValue).toBe(3);
    expect(wrapper.state().lastValidValue).toBe(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'abc', '3');

    wrapper.find('input#abc').simulate('blur', {
      target: {
        value: '4',
      },
    });
    expect(wrapper.state().inputValue).toBe('3');
    expect(wrapper.state().sliderValue).toBe(3);
    expect(wrapper.state().lastValidValue).toBe(3);
    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });
});
