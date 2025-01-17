import React from 'react';
import { render } from '@testing-library/react';

import ConnectUsb from './ConnectUsb';

jest.mock('helpers/useI18n', () => () => ({
  initialize: {
    connect_usb: {
      title: 'USB Connection',
      title_sub: ' (HEXA & Ador Only)',
      tutorial1: 'Connect the machine with your computer with USB cable.',
      tutorial2: 'Click Next.',
      turn_off_machine: 'Turn off the machine.',
      turn_on_machine: 'Turn on the machine.',
      wait_for_turning_on: 'Wait for the machine to turn on.',
    },
    next: 'Next',
    back: 'Back',
  },
}));
jest.mock('react-router-dom', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('react-router-dom');

  return {
    __esModule: true,
    ...originalModule,
    useLocation: jest.fn(() => ({
      pathname: '/initialize/connect/connect-usb',
      search: '?model=ado1',
      hash: '',
      state: null,
    })),
  };
});

describe('test ConnectUsb', () => {
  test('should render correctly', () => {
    const { container } = render(<ConnectUsb />);
    expect(container).toMatchSnapshot();
  });
});
