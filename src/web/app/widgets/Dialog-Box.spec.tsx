import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import DialogBox from './Dialog-Box';

test('should render correctly', () => {
  const mockOnClose = jest.fn();
  const mockOnClick = jest.fn();
  const wrapper = shallow(<DialogBox
    arrowDirection="top"
    arrowHeight={10}
    arrowWidth={20}
    arrowColor="black"
    arrowPadding={30}
    position={{}}
    onClose={mockOnClose}
    onClick={mockOnClick}
  />);
  expect(toJson(wrapper)).toMatchSnapshot();

  wrapper.find('.dialog-box-container').simulate('click');
  expect(mockOnClick).toHaveBeenCalledTimes(1);

  wrapper.find('.close-btn').simulate('click');
  expect(mockOnClose).toHaveBeenCalledTimes(1);
});
