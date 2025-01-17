import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { MyCloudContext } from 'app/contexts/MyCloudContext';

import Head from './Head';

jest.mock('helpers/useI18n', () => () => ({
  my_cloud: {
    sort: {
      most_recent: 'Most Recent',
      oldest: 'Oldest',
      a_to_z: 'Name: A - Z',
      z_to_a: 'Name: Z - A',
    },
  },
}));

const mockSetSortby = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockContext: any = {
  sortBy: 'recent',
  setSortBy: mockSetSortby,
};

jest.mock('app/contexts/MyCloudContext', () => ({
  MyCloudContext: React.createContext(null),
}));

const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
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
      </MyCloudContext.Provider>
    );
    expect(container).toMatchSnapshot();

    fireEvent.mouseDown(container.querySelector('.select .ant-select-selector'));
    const dropdown = baseElement.querySelector('.select-dropdown');
    expect(dropdown).toBeInTheDocument();
    fireEvent.click(getByText('Name: A - Z'));
    expect(mockSetSortby).toBeCalledTimes(1);
    expect(mockSetSortby).toBeCalledWith('a2z', { label: 'Name: A - Z', value: 'a2z' });
  });

  test('should rendered correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    const { container, getByText } = render(
      <MyCloudContext.Provider value={mockContext}>
        <Head />
      </MyCloudContext.Provider>
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Name: A - Z'));
    expect(mockSetSortby).toBeCalledTimes(1);
    expect(mockSetSortby).toBeCalledWith('a2z');
  });
});
