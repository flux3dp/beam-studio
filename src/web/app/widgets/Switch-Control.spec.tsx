import * as React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import SwitchControl from './Switch-Control';

describe('test Switch-Control', () => {
  test('should render correctly', () => {
    const mockOnChange = jest.fn();
    const wrapper = mount(<SwitchControl
      id="abc"
      name="rotary_mode"
      label="Work Area"
      onText="Enable"
      offText="Disable"
      default
      onChange={mockOnChange}
    />);
    expect(toJson(wrapper)).toMatchSnapshot();
    expect(wrapper.state().checked).toBeTruthy();

    wrapper.find('input#abc').simulate('change', { target: { checked: false } });
    expect(toJson(wrapper)).toMatchSnapshot();
    expect(wrapper.state().checked).toBeFalsy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'abc', false);
  });

  test('should render correctly if disabled', () => {
    const mockOnChange = jest.fn();
    const wrapper = mount(<SwitchControl
      id="abc"
      name="rotary_mode"
      label="Work Area"
      isDisabled
      default
      onChange={mockOnChange}
    />);
    expect(toJson(wrapper)).toMatchSnapshot();
    expect(wrapper.state().checked).toBeTruthy();

    wrapper.find('input#abc').simulate('change', { target: { checked: false } });
    expect(wrapper.state().checked).toBeTruthy();
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
