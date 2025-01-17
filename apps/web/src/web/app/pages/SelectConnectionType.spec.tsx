import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SelectConnectionType from './SelectConnectionType';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '#/initialize/connect/select-connection-type',
    search: '?model=ado1',
  }),
}));

const mockShowLoadingWindow = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  showLoadingWindow: (...args) => mockShowLoadingWindow(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  initialize: {
    select_connection_type: 'How do you wish to connect?',
    connection_types: {
      wifi: 'Wi-Fi',
      wired: 'Wired Network',
      ether2ether: 'Direct Connection',
      usb: 'USB Connection',
    },
    connect_usb: {
      title_sub: ' (HEXA Only)',
    },
    back: 'back',
  },
}));

const mockWindowLocationReload = jest.fn();
jest.mock('app/actions/windowLocation', () => () => mockWindowLocationReload());

describe('test SelectConnectionType', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.location.hash = '?model=ado1';
  });

  test('should render correctly', () => {
    const { container, getByText } = render(<SelectConnectionType />);
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Wi-Fi'));
    expect(window.location.hash).toBe('#initialize/connect/connect-wi-fi?model=ado1');

    fireEvent.click(getByText('Wired Network'));
    expect(window.location.hash).toBe('#initialize/connect/connect-wired?model=ado1');

    fireEvent.click(getByText('Direct Connection'));
    expect(window.location.hash).toBe('#initialize/connect/connect-ethernet?model=ado1');

    fireEvent.click(getByText('USB Connection'));
    expect(window.location.hash).toBe('#initialize/connect/connect-usb?model=ado1');

    fireEvent.click(getByText('back'));
    expect(window.location.hash).toBe('#initialize/connect/select-machine-model');
  });
});
