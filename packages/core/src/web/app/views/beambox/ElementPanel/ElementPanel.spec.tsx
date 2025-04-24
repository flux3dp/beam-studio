import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { ContentType } from '@core/app/constants/element-panel-constants';

window.innerHeight = 667;

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('./MainContent', () => 'main-content');

const mockSetActiveMainType = jest.fn();
const mockSetActiveSubType = jest.fn();
const mockSetSearchKey = jest.fn();
const mockHandleSearch = jest.fn();
const mockContext: any = {
  activeMainType: 'basic',
  activeSubType: undefined,
  contentType: ContentType.MainType,
  handleSearch: mockHandleSearch,
  hasLogin: true,
  open: true,
  searchKey: undefined,
  setActiveMainType: mockSetActiveMainType,
  setActiveSubType: mockSetActiveSubType,
  setSearchKey: mockSetSearchKey,
};

import { ElementPanelContent } from './ElementPanel';

describe('test ElementPanel Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render MainType correctly', () => {
    const { baseElement, getByText } = render(
      <ElementPanelContext.Provider value={mockContext}>
        <ElementPanelContent />
      </ElementPanelContext.Provider>,
    );

    expect(baseElement).toMatchSnapshot();

    // Change main type
    const selector = baseElement.querySelector('.ant-select-selector');

    fireEvent.mouseDown(selector!);
    fireEvent.click(getByText('Decor'));
    expect(mockSetActiveMainType).toHaveBeenCalledWith('decor', { label: 'Decor', value: 'decor' });

    // Open search
    const searchButton = baseElement.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockSetSearchKey).toHaveBeenCalledWith('');
  });

  it('should render SubType correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext.Provider
        value={{ ...mockContext, activeSubType: 'graphics', contentType: ContentType.SubType }}
      >
        <ElementPanelContent />
      </ElementPanelContext.Provider>,
    );

    expect(baseElement).toMatchSnapshot();

    // Back to main type
    const backButton = baseElement.querySelector('.back-button');

    fireEvent.click(backButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);

    // Open search
    const searchButton = baseElement.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockSetSearchKey).toHaveBeenCalledWith('');
  });

  it('should render Search correctly', () => {
    const { baseElement } = render(
      <ElementPanelContext.Provider
        value={{ ...mockContext, activeSubType: 'graphics', contentType: ContentType.Search, searchKey: '123' }}
      >
        <ElementPanelContent />
      </ElementPanelContext.Provider>,
    );

    expect(baseElement).toMatchSnapshot();

    // Back to sub type
    const backButton = baseElement.querySelector('.back-button');

    fireEvent.click(backButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith('graphics');

    // Handle search with button
    const searchButton = baseElement.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockHandleSearch).toHaveBeenCalledTimes(1);
    expect(mockHandleSearch).toHaveBeenNthCalledWith(1);

    // Handle search with enter
    const searchInput = baseElement.querySelector('.search-input input');

    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(mockHandleSearch).toHaveBeenCalledTimes(2);
    expect(mockHandleSearch).toHaveBeenNthCalledWith(2);

    // Clear search
    const clearButton = baseElement.querySelector('.ant-input-clear-icon');

    fireEvent.click(clearButton);
    expect(mockHandleSearch).toHaveBeenCalledTimes(3);
    expect(mockHandleSearch).toHaveBeenNthCalledWith(3, '');
  });
});

describe('test ElementPanel Header in mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobile.mockReturnValue(true);
  });

  it('should render MainType correctly', async () => {
    const { container, getByText } = render(
      <ElementPanelContext.Provider value={mockContext}>
        <ElementPanelContent />
      </ElementPanelContext.Provider>,
    );
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-627px)))'), {
      timeout: 3000,
    });
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();

    // Change main type
    fireEvent.click(getByText('Decor'));
    expect(container).toMatchSnapshot();
    expect(mockSetActiveMainType).toHaveBeenCalledWith('decor');

    // Open search
    const searchButton = container.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockSetSearchKey).toHaveBeenCalledWith('');
  });

  it('should render SubType correctly', async () => {
    const { container } = render(
      <ElementPanelContext.Provider
        value={{ ...mockContext, activeSubType: 'graphics', contentType: ContentType.SubType }}
      >
        <ElementPanelContent />
      </ElementPanelContext.Provider>,
    );

    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-627px)))'), {
      timeout: 3000,
    });
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();

    // Back to main type
    const backButton = container.querySelector('.back-button');

    fireEvent.click(backButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);

    // Open search
    const searchButton = container.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockSetSearchKey).toHaveBeenCalledWith('');
  });

  it('should render Search correctly', async () => {
    const { container } = render(
      <ElementPanelContext.Provider
        value={{ ...mockContext, activeSubType: 'graphics', contentType: ContentType.Search, searchKey: '123' }}
      >
        <ElementPanelContent />
      </ElementPanelContext.Provider>,
    );

    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-627px)))'), {
      timeout: 3000,
    });
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();

    // Back to sub type
    const backButton = container.querySelector('.back-button');

    fireEvent.click(backButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith('graphics');

    // Handle search with button
    const searchButton = container.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockHandleSearch).toHaveBeenCalledTimes(1);
    expect(mockHandleSearch).toHaveBeenNthCalledWith(1);

    // Handle search with enter
    const searchInput = container.querySelector('.search-input input');

    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(mockHandleSearch).toHaveBeenCalledTimes(2);
    expect(mockHandleSearch).toHaveBeenNthCalledWith(2);

    // Clear search
    const clearButton = container.querySelector('.ant-input-clear-icon');

    fireEvent.click(clearButton);
    expect(mockHandleSearch).toHaveBeenCalledTimes(3);
    expect(mockHandleSearch).toHaveBeenNthCalledWith(3, '');
  });
});
