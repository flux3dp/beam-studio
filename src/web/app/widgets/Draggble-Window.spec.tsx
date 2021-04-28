import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import DraggbleWindow from './Draggble-Window';

test('should render correctly', () => {
  const mockOnClose = jest.fn();
  const wrapper = shallow(<DraggbleWindow
    title="Beam Studio"
    defaultPosition={{ x: 0, y: 0 }}
    containerClass="123"
    handleClass="456"
    onClose={mockOnClose}
  />);
  expect(toJson(wrapper)).toMatchSnapshot();

  wrapper.find('.traffic-light-close').simulate('click');
  expect(mockOnClose).toHaveBeenCalledTimes(1);
});
