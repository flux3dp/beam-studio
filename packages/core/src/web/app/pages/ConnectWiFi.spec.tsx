import React from 'react';
import { render } from '@testing-library/react';

import ConnectWifi from './ConnectWiFi';

jest.mock('helpers/useI18n', () => () => ({
  initialize: {
    connect_wifi: {
      title: 'Connecting to Wi-Fi',
      tutorial1: '1. Go to Touch Panel > Click "Network" > "Connect to WiFi".',
      tutorial1_ador: 'tutorial1',
      tutorial2: '2. Select and connect your preferred Wi-Fi.',
      what_if_1: "What if I don't see my Wi-Fi?",
      what_if_1_content: 'what_if_1_content',
      what_if_2: "What if I don't see any Wi-Fi?",
      what_if_2_content: 'what_if_2_content',
    },
    next: 'Next',
    back: 'Back',
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '#/initialize/connect/select-connection-type',
  }),
}));

// eslint-disable-next-line import/first

describe('test ConnectWiFi', () => {
  test('should render correctly', () => {
    const { container } = render(<ConnectWifi />);
    expect(container).toMatchSnapshot();
  });

  test('should render correctly when is ador', () => {
    window.location.hash = '?model=ado1';
    const { container } = render(<ConnectWifi />);
    expect(container).toMatchSnapshot();
  });
});
