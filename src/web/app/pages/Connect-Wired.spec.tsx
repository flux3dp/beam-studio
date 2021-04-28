import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

jest.mock('helpers/i18n', () => ({
  lang: {
    initialize: {
      connect_wired: {
        title: 'Connecting to Wired Network',
        tutorial1: '1. Connect the machine with your router.',
        tutorial2: '2. Press "Network" to get the wired network IP.',
        what_if_1: 'What if the IP is empty?',
        what_if_1_content: '1. Make sure the Ethernet Cable is fully plugged in.\n2. If there is no MAC Address of the wired network on the touchscreen, please contact FLUX Support.',
        what_if_2: 'What if the IP starts with 169?',
        what_if_2_content: '1. If the IP address starts with 169.254, it should be a DHCP setting issue, please contact your ISP (internet service provider) for further assistance.\n2. If your computer connects to the internet directly using PPPoE, please change to using the router to connect using PPPoE, and enable DHCP feature in the router.',
      },
      next: 'Next',
      back: 'Back',
    },
  },
}));

// eslint-disable-next-line import/first
import connectWired from './Connect-Wired';

describe('test Connect-Wired', () => {
  test('should render correctly', () => {
    const ConnectWired = connectWired();
    const wrapper = shallow(<ConnectWired />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
