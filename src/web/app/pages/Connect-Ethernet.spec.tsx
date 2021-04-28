import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

jest.mock('helpers/i18n', () => ({
  lang: {
    initialize: {
      connect_ethernet: {
        title: 'Direct Connection',
        tutorial1: '1. Connect the machine with your computer with ethernet cable.',
        tutorial2_1: '2. Follow ',
        tutorial2_a_text: 'this guide',
        tutorial2_a_href_mac: 'https://support.flux3dp.com/hc/en-us/articles/360001517076',
        tutorial2_a_href_win: 'https://support.flux3dp.com/hc/en-us/articles/360001507715',
        tutorial2_2: ' to make your comuter as a router.',
        tutorial3: '3. Click Next.',
      },
      next: 'Next',
      back: 'Back',
    },
  },
}));

// eslint-disable-next-line import/first
import connectEthernet from './Connect-Ethernet';

describe('test Connect-Ethernet', () => {
  test('should render correctly in mac', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
    const ConnectEthernet = connectEthernet();
    const wrapper = shallow(<ConnectEthernet />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  test('should render correctly in win', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
    const ConnectEthernet = connectEthernet();
    const wrapper = shallow(<ConnectEthernet />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
