import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { ContentType } from '@core/app/constants/element-panel-constants';

jest.mock('@core/app/contexts/ElementPanelContext', () => ({ ElementPanelContext: React.createContext({}) }));

const mockUpdateSearchContents = jest.fn();
const mockSetSearchKey = jest.fn();

import SearchBar from './SearchBar';

describe('test SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search bar and handle search correctly', () => {
    const { baseElement, rerender } = render(
      <ElementPanelContext
        value={
          {
            activeSubType: 'shape',
            contentType: ContentType.SubType,
            setSearchKey: mockSetSearchKey,
            updateSearchContents: mockUpdateSearchContents,
          } as any
        }
      >
        <SearchBar />
      </ElementPanelContext>,
    );

    // Handle error when input is empty
    const searchButton = baseElement.querySelector('.search-button')!;

    fireEvent.click(searchButton);
    expect(mockUpdateSearchContents).not.toHaveBeenCalled();
    expect(baseElement).toMatchSnapshot();

    // Handle search with enter
    const searchInput = baseElement.querySelector('.search-input input')!;

    act(() => {
      fireEvent.change(searchInput, { target: { value: '123' } });
    });
    expect(mockSetSearchKey).toHaveBeenCalledWith('123');
    rerender(
      <ElementPanelContext
        value={
          {
            activeSubType: 'shape',
            contentType: ContentType.Search,
            searchKey: '123',
            setSearchKey: mockSetSearchKey,
            updateSearchContents: mockUpdateSearchContents,
          } as any
        }
      >
        <SearchBar />
      </ElementPanelContext>,
    );
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(1, '123');

    // Handle search with button
    rerender(
      <ElementPanelContext
        value={
          {
            activeSubType: 'shape',
            contentType: ContentType.Search,
            searchKey: '321',
            setSearchKey: mockSetSearchKey,
            updateSearchContents: mockUpdateSearchContents,
          } as any
        }
      >
        <SearchBar />
      </ElementPanelContext>,
    );
    fireEvent.click(searchButton);
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(2, '321');

    // Clear search
    const clearButton = baseElement.querySelector('.ant-input-clear-icon')!;

    fireEvent.click(clearButton);
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(3, '');
  });
});
