import * as React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';

const mockWrite = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  write: mockWrite,
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    initialize: {
      no_machine: 'I don\'t have a machine now.',
      select_machine_type: 'Select Your Model',
    },
  },
}));

// eslint-disable-next-line import/first
import selectMachineType from './Select-Machine-Type';

describe('test Select-Machine-Type', () => {
  test('should render correctly', () => {
    const SelectMachineType = selectMachineType();
    const wrapper = mount(<SelectMachineType />);
    expect(toJson(wrapper)).toMatchSnapshot();

    wrapper.find('.btn-action').at(0).simulate('click');
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'model', 'fbm1');
    expect(mockWrite).toHaveBeenNthCalledWith(2, 'workarea', 'fbm1');
    expect(window.location.hash).toBe('#initialize/connect/select-connection-type');

    wrapper.find('.btn-action').at(1).simulate('click');
    expect(mockWrite).toHaveBeenNthCalledWith(3, 'model', 'fbb1b');
    expect(mockWrite).toHaveBeenNthCalledWith(4, 'workarea', 'fbb1b');
    expect(window.location.hash).toBe('#initialize/connect/select-connection-type');

    wrapper.find('.btn-action').at(2).simulate('click');
    expect(mockWrite).toHaveBeenNthCalledWith(5, 'model', 'fbb1p');
    expect(mockWrite).toHaveBeenNthCalledWith(6, 'workarea', 'fbb1p');
    expect(window.location.hash).toBe('#initialize/connect/select-connection-type');

    wrapper.find('.btn-link').simulate('click');
    expect(mockWrite).toHaveBeenCalledTimes(6);
    expect(window.location.hash).toBe('#initialize/connect/skip-connect-machine');
  });
});
