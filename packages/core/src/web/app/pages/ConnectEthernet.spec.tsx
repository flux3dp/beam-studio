import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConnectEthernet from './ConnectEthernet';
import { __setMockOS } from '@mocks/@core/helpers/getOS';
import i18n from '@mocks/@core/helpers/i18n';

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (url) => mockOpen(url),
}));

describe('test ConnectEthernet', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should render correctly in mac', () => {
    __setMockOS('MacOS');

    const { container, getByText } = render(<ConnectEthernet />);

    expect(container).toMatchSnapshot();

    expect(mockOpen).not.toHaveBeenCalled();
    fireEvent.click(getByText(i18n.lang.initialize.connect_ethernet.tutorial2_a_text));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, i18n.lang.initialize.connect_ethernet.tutorial2_a_href_mac);
  });

  test('should render correctly in win', () => {
    __setMockOS('Windows');

    const { container, getByText } = render(<ConnectEthernet />);

    expect(container).toMatchSnapshot();

    expect(mockOpen).not.toHaveBeenCalled();
    fireEvent.click(getByText(i18n.lang.initialize.connect_ethernet.tutorial2_a_text));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, i18n.lang.initialize.connect_ethernet.tutorial2_a_href_win);
  });
});
