import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

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
const mockUpdateSearchContents = jest.fn();
const mockCloseDrawer = jest.fn();
const mockSetDrawerMode = jest.fn();

let mockStoreState: any = {
  activeMainType: 'basic',
  activeSubType: undefined,
  closeDrawer: mockCloseDrawer,
  contentType: ContentType.MainType,
  hasLogin: true,
  open: true,
  searchKey: undefined,
  setActiveMainType: mockSetActiveMainType,
  setActiveSubType: mockSetActiveSubType,
  setSearchKey: mockSetSearchKey,
  updateSearchContents: mockUpdateSearchContents,
};

jest.mock('@core/app/stores/elementPanelStore', () => ({
  useElementPanelStore: (selector: (state: any) => any) => selector(mockStoreState),
}));

jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: () => ({ setDrawerMode: mockSetDrawerMode }),
}));

import { ElementPanelContent } from './ElementPanel';

describe('test ElementPanel Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState = {
      activeMainType: 'basic',
      activeSubType: undefined,
      closeDrawer: mockCloseDrawer,
      contentType: ContentType.MainType,
      hasLogin: true,
      open: true,
      searchKey: undefined,
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
      updateSearchContents: mockUpdateSearchContents,
    };
  });

  it('should render MainType correctly', () => {
    const { baseElement, getByText } = render(<ElementPanelContent />);

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
    mockStoreState = { ...mockStoreState, activeSubType: 'shape', contentType: ContentType.SubType };

    const { baseElement } = render(<ElementPanelContent />);

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
    mockStoreState = { ...mockStoreState, activeSubType: 'shape', contentType: ContentType.Search, searchKey: '123' };

    const { baseElement } = render(<ElementPanelContent />);

    expect(baseElement).toMatchSnapshot();

    // Back to sub type
    const backButton = baseElement.querySelector('.back-button');

    fireEvent.click(backButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith('shape');

    // Handle search with button
    const searchButton = baseElement.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(1, '123');

    // Handle search with enter
    const searchInput = baseElement.querySelector('.search-input input');

    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(2, '123');

    // Clear search
    const clearButton = baseElement.querySelector('.ant-input-clear-icon');

    fireEvent.click(clearButton);
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(3, '');
  });
});

describe('test ElementPanel Header in mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobile.mockReturnValue(true);
    mockStoreState = {
      activeMainType: 'basic',
      activeSubType: undefined,
      closeDrawer: mockCloseDrawer,
      contentType: ContentType.MainType,
      hasLogin: true,
      open: true,
      searchKey: undefined,
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
      updateSearchContents: mockUpdateSearchContents,
    };
  });

  it('should render MainType correctly', async () => {
    const { container, getByText } = render(<ElementPanelContent />);
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
    mockStoreState = { ...mockStoreState, activeSubType: 'shape', contentType: ContentType.SubType };

    const { container } = render(<ElementPanelContent />);

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
    mockStoreState = { ...mockStoreState, activeSubType: 'shape', contentType: ContentType.Search, searchKey: '123' };

    const { container } = render(<ElementPanelContent />);

    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-627px)))'), {
      timeout: 3000,
    });
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();

    // Back to sub type
    const backButton = container.querySelector('.back-button');

    fireEvent.click(backButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith('shape');

    // Handle search with button
    const searchButton = container.querySelector('.search-button');

    fireEvent.click(searchButton);
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(1);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(1, '123');

    // Handle search with enter
    const searchInput = container.querySelector('.search-input input');

    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(2, '123');

    // Clear search
    const clearButton = container.querySelector('.ant-input-clear-icon');

    fireEvent.click(clearButton);
    expect(mockUpdateSearchContents).toHaveBeenCalledTimes(3);
    expect(mockUpdateSearchContents).toHaveBeenNthCalledWith(3, '');
  });
});
