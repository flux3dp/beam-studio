import React from 'react';
import { render } from '@testing-library/react';

import ConnectWired from './ConnectWired';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '#/initialize/connect/select-connection-type',
    search: '?model=ado1',
  }),
}));

jest.mock('helpers/useI18n', () => () => ({
  initialize: {
    connect_wired: {
      title: 'Connecting to Wired Network',
      tutorial1: '1. Connect the machine with your router.',
      tutorial2: '2. Press "Network" to get the wired network IP.',
      tutorial2_ador: 'tutorial2',
      what_if_1: 'What if the IP is empty?',
      what_if_1_content: 'what_if_1_content',
      what_if_2: 'What if the IP starts with 169?',
      what_if_2_content: 'what_if_2_content',
    },
    next: 'Next',
    back: 'Back',
  },
}));

describe('test ConnectWired', () => {
  it('should render correctly', () => {
    const { container } = render(<ConnectWired />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when is ador', () => {
    window.location.hash = '?model=ado1';
    const { container } = render(<ConnectWired />);
    expect(container).toMatchSnapshot();
  });
});
