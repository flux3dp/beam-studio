import React from 'react';

import { render } from '@testing-library/react';

import ConnectUsb from './ConnectUsb';

jest.mock('react-router-dom', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('react-router-dom');

  return {
    __esModule: true,
    ...originalModule,
    useLocation: jest.fn(() => ({
      hash: '',
      pathname: '/initialize/connect/connect-usb',
      search: '?model=ado1',
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
