import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import SelectConnectionType from './SelectConnectionType';

const mockSearchParams = new URLSearchParams('model=ado1');
const mockSetSearchParams = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const mockShowLoadingWindow = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoadingWindow: (...args) => mockShowLoadingWindow(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  initialize: {
    back: 'back',
    connect_usb: {
      title_sub: ' (HEXA Only)',
    },
    connection_types: {
      ether2ether: 'Direct Connection',
      usb: 'USB Connection',
      wifi: 'Wi-Fi',
      wired: 'Wired Network',
    },
    select_connection_type: 'How do you wish to connect?',
  },
}));

const mockWindowLocationReload = jest.fn();

jest.mock('@core/app/actions/windowLocation', () => () => mockWindowLocationReload());

describe('test SelectConnectionType', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.location.hash = '?model=ado1';
  });

  test('should render correctly', () => {
    const { container, getByText } = render(<SelectConnectionType />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Wi-Fi'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-wi-fi?model=ado1');

    fireEvent.click(getByText('Wired Network'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-wired?model=ado1');

    fireEvent.click(getByText('Direct Connection'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-ethernet?model=ado1');

    fireEvent.click(getByText('USB Connection'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-usb?model=ado1');

    fireEvent.click(getByText('back'));
    expect(window.location.hash).toBe('#/initialize/connect/select-machine-model');
  });
});
