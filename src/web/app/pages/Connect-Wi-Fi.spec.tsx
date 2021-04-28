import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

jest.mock('helpers/i18n', () => ({
  lang: {
    initialize: {
      connect_wifi: {
        title: 'Connecting to Wi-Fi',
        tutorial1: '1. Go to Touch Panel > Click "Network" > "Connect to WiFi".',
        tutorial2: '2. Select and connect your prefered Wi-Fi.',
        what_if_1: 'What if I don\'t see my Wi-Fi?',
        what_if_1_content: '1. The Wi-Fi encryption mode should be WPA2 or no password.\n2. The encryption mode can be set in the Wi-Fi router administration interface. If the router doesn’t support WPA2 and you need help picking out the right router, please contact FLUX Support.',
        what_if_2: 'What if I don\'t see any Wi-Fi?',
        what_if_2_content: '1. Make sure the Wi-Fi dongle is fully plugged in.\n2. If there is no MAC Address of the wireless network on the touchscreen, please contact FLUX Support.\n3. The Wi-Fi channel should be 2.4Ghz (5Ghz is not supported).',
      },
      next: 'Next',
      back: 'Back',
    },
  },
}));

// eslint-disable-next-line import/first
import connectWifi from './Connect-Wi-Fi';

describe('test Connect-Wi-Fi', () => {
  test('should render correctly', () => {
    const ConnectWifi = connectWifi();
    const wrapper = shallow(<ConnectWifi />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
