import * as React from 'react';
import en from 'app/lang/en';

jest.mock('helpers/i18n', () => ({
  lang: {
    monitor: {
      ...en.monitor,
    },
  },
}));

import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import MonitorControl from './MonitorControl';

test('should render correctly', () => {
  const wrapper = shallow(<MonitorControl />);
  expect(toJson(wrapper)).toMatchSnapshot();
});
