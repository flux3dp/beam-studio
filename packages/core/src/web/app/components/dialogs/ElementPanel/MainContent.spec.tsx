import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { ContentType, MainTypes } from '@core/app/constants/element-panel-constants';

const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoginDialog: mockShowLoginDialog,
}));

jest.mock('@core/app/contexts/ElementPanelContext', () => ({ ElementPanelContext: React.createContext({}) }));

jest.mock('./Element/BuiltinElement', () => 'builtin-element');
jest.mock('./Element/NPElement', () => 'NP-element');
jest.mock('./GridContent', () => 'grid-content');

const mockSetActiveMainType = jest.fn();
const mockSetActiveSubType = jest.fn();
const mockSetSearchKey = jest.fn();

import MainContent from './MainContent';

describe('test MainContent', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ElementPanelContext
        value={{ contents: [{}, {}], contentType: ContentType.MainType, hasLogin: true, historyIcons: [] } as any}
      >
        <MainContent types={[]} />
      </ElementPanelContext>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when not login', () => {
    const { container } = render(
      <ElementPanelContext
        value={{ contents: [{}, {}], contentType: ContentType.MainType, hasLogin: false, historyIcons: [] } as any}
      >
        <MainContent types={[]} />
      </ElementPanelContext>,
    );

    expect(container).toMatchSnapshot();

    const loginButton = container.querySelector('.login');

    fireEvent.click(loginButton!);
    expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
  });

  it('should render history correctly', () => {
    const { container } = render(
      <ElementPanelContext
        value={
          {
            contents: [{}, {}],
            contentType: ContentType.MainType,
            hasLogin: true,
            historyIcons: [
              { path: { fileName: 'icon-circle', folder: 'basic' }, type: 'builtin' },
              { npIcon: { id: '1234', thumbnail_url: 'url_1234' }, type: 'np' },
              { path: { fileName: 'i_circular-1', folder: 'decor' }, type: 'builtin' },
              { npIcon: { id: '4321', thumbnail_url: 'url_4321' }, type: 'np' },
            ],
          } as any
        }
      >
        <MainContent types={[]} />
      </ElementPanelContext>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render search hint correctly', () => {
    const { container } = render(
      <ElementPanelContext
        value={
          {
            contents: [],
            contentType: ContentType.Search,
            hasLogin: true,
            historyIcons: [],
            setActiveMainType: mockSetActiveMainType,
            setActiveSubType: mockSetActiveSubType,
            setSearchKey: mockSetSearchKey,
          } as any
        }
      >
        <MainContent types={MainTypes} />
      </ElementPanelContext>,
    );

    expect(container).toMatchSnapshot();

    const typeButton = container.querySelectorAll('.categories > button')[3];

    fireEvent.click(typeButton!);
    expect(mockSetActiveMainType).toHaveBeenCalledWith(MainTypes[3]);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
  });

  it('should render search hint correctly when no result', () => {
    const { container } = render(
      <ElementPanelContext
        value={
          {
            contents: [{ term: 'search' }],
            contentType: ContentType.Search,
            hasLogin: true,
            historyIcons: [],
            setActiveMainType: mockSetActiveMainType,
            setActiveSubType: mockSetActiveSubType,
            setSearchKey: mockSetSearchKey,
          } as any
        }
      >
        <MainContent types={MainTypes} />
      </ElementPanelContext>,
    );

    expect(container).toMatchSnapshot();

    const typeButton = container.querySelectorAll('.categories > button')[3];

    fireEvent.click(typeButton!);
    expect(mockSetActiveMainType).toHaveBeenCalledWith(MainTypes[3]);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
    expect(mockSetActiveSubType).toHaveBeenCalledWith(undefined);
  });
});
