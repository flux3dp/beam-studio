import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConnectEthernet from './ConnectEthernet';

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (url) => mockOpen(url),
}));

jest.mock('helpers/useI18n', () => () => ({
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
}));

describe('test ConnectEthernet', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should render correctly in mac', () => {
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });
    const { container, getByText } = render(<ConnectEthernet />);
    expect(container).toMatchSnapshot();

    expect(mockOpen).not.toBeCalled();
    fireEvent.click(getByText('this guide'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(
      1,
      'https://support.flux3dp.com/hc/en-us/articles/360001517076'
    );
  });

  test('should render correctly in win', () => {
    Object.defineProperty(window, 'os', {
      value: 'Windows',
    });
    const { container, getByText } = render(<ConnectEthernet />);
    expect(container).toMatchSnapshot();

    expect(mockOpen).not.toBeCalled();
    fireEvent.click(getByText('this guide'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(
      1,
      'https://support.flux3dp.com/hc/en-us/articles/360001507715'
    );
  });
});
