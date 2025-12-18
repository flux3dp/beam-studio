import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { ContentType, MainTypes } from '@core/app/constants/element-panel-constants';

const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoginDialog: mockShowLoginDialog,
}));

jest.mock('./Element/BuiltinElement', () => 'builtin-element');
jest.mock('./Element/NPElement', () => 'NP-element');
jest.mock('./GridContent', () => 'grid-content');

const mockSetActiveMainType = jest.fn();
const mockSetActiveSubType = jest.fn();
const mockSetSearchKey = jest.fn();

let mockStoreState: any = {};

jest.mock('@core/app/stores/elementPanelStore', () => ({
  useElementPanelStore: (selector: (state: any) => any) => selector(mockStoreState),
}));

const mockUseStorageStore = (selector: (state: any) => any) =>
  selector({ 'elements-history': mockStoreState.historyIcons });

mockUseStorageStore.subscribe = jest.fn();

jest.mock('@core/app/stores/storageStore', () => ({
  getStorage: jest.fn(),
  useStorageStore: mockUseStorageStore,
}));

import MainContent from './MainContent';

describe('test MainContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockStoreState = {
      contents: [{}, {}],
      contentType: ContentType.MainType,
      hasLogin: true,
      historyIcons: [],
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
    };

    const { container } = render(<MainContent types={[]} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when not login', () => {
    mockStoreState = {
      contents: [{}, {}],
      contentType: ContentType.MainType,
      hasLogin: false,
      historyIcons: [],
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
    };

    const { container } = render(<MainContent types={[]} />);

    expect(container).toMatchSnapshot();

    const loginButton = container.querySelector('.login');

    fireEvent.click(loginButton!);
    expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
  });

  it('should render history correctly', () => {
    mockStoreState = {
      contents: [{}, {}],
      contentType: ContentType.MainType,
      hasLogin: true,
      historyIcons: [
        { path: { fileName: 'icon-circle', folder: 'basic' }, type: 'builtin' },
        { npIcon: { id: '1234', thumbnail_url: 'url_1234' }, type: 'np' },
        { path: { fileName: 'i_circular-1', folder: 'decor' }, type: 'builtin' },
        { npIcon: { id: '4321', thumbnail_url: 'url_4321' }, type: 'np' },
      ],
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
    };

    const { container } = render(<MainContent types={[]} />);

    expect(container).toMatchSnapshot();
  });

  it('should render search hint correctly', () => {
    mockStoreState = {
      contents: [],
      contentType: ContentType.Search,
      hasLogin: true,
      historyIcons: [],
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
    };

    const { container } = render(<MainContent types={MainTypes} />);

    expect(container).toMatchSnapshot();

    const typeButton = container.querySelectorAll('.categories > button')[3];

    fireEvent.click(typeButton!);
    expect(mockSetActiveMainType).toHaveBeenCalledWith(MainTypes[3]);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
  });

  it('should render search hint correctly when no result', () => {
    mockStoreState = {
      contents: [{ term: 'search' }],
      contentType: ContentType.Search,
      hasLogin: true,
      historyIcons: [],
      setActiveMainType: mockSetActiveMainType,
      setActiveSubType: mockSetActiveSubType,
      setSearchKey: mockSetSearchKey,
    };

    const { container } = render(<MainContent types={MainTypes} />);

    expect(container).toMatchSnapshot();

    const typeButton = container.querySelectorAll('.categories > button')[3];

    fireEvent.click(typeButton!);
    expect(mockSetActiveMainType).toHaveBeenCalledWith(MainTypes[3]);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
  });
});
