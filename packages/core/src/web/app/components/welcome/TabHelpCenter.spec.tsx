import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

jest.mock('@core/app/components/welcome/GridGuide', () => 'mock-grid-guide');

import TabHelpCenter from './TabHelpCenter';

describe('test TabHelpCenter', () => {
  it('should render correctly', () => {
    const { container, getByText } = render(<TabHelpCenter />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Visit Help Center'));
    expect(mockOpen).toHaveBeenNthCalledWith(1, 'https://support.flux3dp.com/hc/en-us');
    fireEvent.click(getByText('Submit a Request'));
    expect(mockOpen).toHaveBeenNthCalledWith(2, 'https://support.flux3dp.com/hc/en-us/requests/new');
  });
});
