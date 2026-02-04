import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';

jest.mock('@core/app/contexts/ElementPanelContext', () => ({ ElementPanelContext: React.createContext({}) }));

jest.mock('./Element/BuiltinElement', () => 'builtin-element');
jest.mock('./Element/NPElement', () => 'NP-element');
jest.mock('./Element/Skeleton', () => 'skeleton');

const mockGetNPIcons = jest.fn();
const mockSetActiveSubType = jest.fn();

import GridContent from './GridContent';

describe('test GridContent', () => {
  it('should render mainType content correctly', () => {
    // sub type label + builtin icons
    const { container } = render(
      <ElementPanelContext.Provider value={{ getNPIcons: mockGetNPIcons, hasLogin: false } as any}>
        <GridContent
          content={{
            fileNames: ['icon-star1', 'icon-star2'],
            mainType: 'basic',
            npIcons: [
              { id: '1', thumbnail_url: 'url_1' },
              { id: '2', thumbnail_url: 'url_2' },
            ],
            subType: 'shape',
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render mainType content correctly when login', () => {
    // sub type button + builtin icons + np icons
    const { container } = render(
      <ElementPanelContext.Provider
        value={{ getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType } as any}
      >
        <GridContent
          content={{
            fileNames: ['icon-star1', 'icon-star2'],
            mainType: 'basic',
            npIcons: [
              { id: '1', thumbnail_url: 'url_1' },
              { id: '2', thumbnail_url: 'url_2' },
            ],
            subType: 'shape',
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    const subTypeButton = container.querySelector('.subtitle');

    fireEvent.click(subTypeButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith('shape');
  });

  it('should render subType content correctly', () => {
    // builtin icons + np icons + load more button
    const { container } = render(
      <ElementPanelContext.Provider value={{ getNPIcons: mockGetNPIcons, hasLogin: true } as any}>
        <GridContent
          content={{
            fileNames: ['icon-star1', 'icon-star2'],
            mainType: 'basic',
            nextPage: 'next_page_key',
            npIcons: [
              { id: '1', thumbnail_url: 'url_1' },
              { id: '2', thumbnail_url: 'url_2' },
            ],
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    const loadMoreButton = container.querySelector('.more');

    fireEvent.click(loadMoreButton!);
    expect(mockGetNPIcons).toHaveBeenCalledWith({
      fileNames: ['icon-star1', 'icon-star2'],
      mainType: 'basic',
      nextPage: 'next_page_key',
      npIcons: [
        { id: '1', thumbnail_url: 'url_1' },
        { id: '2', thumbnail_url: 'url_2' },
      ],
      term: 'shape',
    });
  });

  it('should render search content correctly', () => {
    // builtin icons + np icons + load more button
    const { container } = render(
      <ElementPanelContext.Provider value={{ getNPIcons: mockGetNPIcons, hasLogin: true } as any}>
        <GridContent
          content={{
            fileNames: ['basic/icon-star1', 'basic/icon-star2', 'decor/i_circular-1'],
            nextPage: 'next_page_key',
            npIcons: [
              { id: '1', thumbnail_url: 'url_1' },
              { id: '2', thumbnail_url: 'url_2' },
            ],
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    const loadMoreButton = container.querySelector('.more');

    fireEvent.click(loadMoreButton!);
    expect(mockGetNPIcons).toHaveBeenCalledWith({
      fileNames: ['icon-star1', 'icon-star2'],
      mainType: 'basic',
      nextPage: 'next_page_key',
      npIcons: [
        { id: '1', thumbnail_url: 'url_1' },
        { id: '2', thumbnail_url: 'url_2' },
      ],
      term: 'shape',
    });
  });

  it('should render loading correctly', () => {
    // builtin icons + np icons + 100 skeletons
    const { container } = render(
      <ElementPanelContext.Provider value={{ getNPIcons: mockGetNPIcons, hasLogin: true } as any}>
        <GridContent
          content={{
            fileNames: ['icon-star1', 'icon-star2'],
            loading: true,
            mainType: 'basic',
            nextPage: 'next_page_key',
            npIcons: [
              { id: '1', thumbnail_url: 'url_1' },
              { id: '2', thumbnail_url: 'url_2' },
            ],
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when missing fileNames', () => {
    // np icons + load more button
    const { container } = render(
      <ElementPanelContext.Provider value={{ getNPIcons: mockGetNPIcons, hasLogin: true } as any}>
        <GridContent
          content={{
            mainType: 'basic',
            nextPage: 'next_page_key',
            npIcons: [
              { id: '1', thumbnail_url: 'url_1' },
              { id: '2', thumbnail_url: 'url_2' },
            ],
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when missing npIcons', () => {
    // builtin icons
    const { container } = render(
      <ElementPanelContext.Provider value={{ getNPIcons: mockGetNPIcons, hasLogin: true } as any}>
        <GridContent
          content={{
            fileNames: ['icon-star1', 'icon-star2'],
            mainType: 'basic',
            term: 'shape',
          }}
        />
      </ElementPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});
