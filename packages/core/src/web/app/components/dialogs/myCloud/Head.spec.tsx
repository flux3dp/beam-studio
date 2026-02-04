import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { MyCloudContext } from '@core/app/contexts/MyCloudContext';

import Head from './Head';

jest.mock('@core/helpers/useI18n', () => () => ({
  my_cloud: {
    sort: {
      a_to_z: 'Name: A - Z',
      most_recent: 'Most Recent',
      oldest: 'Oldest',
      z_to_a: 'Name: Z - A',
    },
  },
}));

const mockSetSortby = jest.fn();

const mockContext: any = {
  setSortBy: mockSetSortby,
  sortBy: 'recent',
};

jest.mock('@core/app/contexts/MyCloudContext', () => ({
  MyCloudContext: React.createContext(null),
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('test Head', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should behave correctly', () => {
    const { baseElement, container, getByText } = render(
      <MyCloudContext.Provider value={mockContext}>
        <Head />
      </MyCloudContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    fireEvent.mouseDown(container.querySelector('.select .ant-select-selector'));

    const dropdown = baseElement.querySelector('.select-dropdown');

    expect(dropdown).toBeInTheDocument();
    fireEvent.click(getByText('Name: A - Z'));
    expect(mockSetSortby).toHaveBeenCalledTimes(1);
    expect(mockSetSortby).toHaveBeenCalledWith('a2z', { label: 'Name: A - Z', value: 'a2z' });
  });

  test('should rendered correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container, getByText } = render(
      <MyCloudContext.Provider value={mockContext}>
        <Head />
      </MyCloudContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Name: A - Z'));
    expect(mockSetSortby).toHaveBeenCalledTimes(1);
    expect(mockSetSortby).toHaveBeenCalledWith('a2z');
  });
});
