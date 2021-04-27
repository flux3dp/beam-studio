import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import List from './List';

test('should render correctly', () => {
  const mockClick = jest.fn();
  const dblClick = jest.fn();
  const wrapper = shallow(<List
    name="flux-list"
    id="12345"
    emptyMessage="this is an empty message"
    className="flux"
    items={[{
      data: {
        name: 'abc',
        id: 123,
      },
      label: {
        item: 'xyz',
      },
      value: 12345,
    }, {
      data: {
        name: 'def',
        id: 456,
      },
      label: {
      },
      value: 67890,
    }]}
    onClick={mockClick}
    ondblclick={dblClick}
  />);
  expect(toJson(wrapper)).toMatchSnapshot();
  expect(mockClick).toHaveBeenCalledTimes(0);
  expect(dblClick).toHaveBeenCalledTimes(0);

  wrapper.find('ul').simulate('click');
  expect(mockClick).toHaveBeenCalledTimes(1);
  expect(dblClick).toHaveBeenCalledTimes(0);

  wrapper.find('ul').simulate('doubleclick');
  expect(mockClick).toHaveBeenCalledTimes(1);
  expect(dblClick).toHaveBeenCalledTimes(1);
});
