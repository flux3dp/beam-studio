import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('./Element/BuiltinElement', () => 'builtin-element');
jest.mock('./Element/NPElement', () => 'NP-element');
jest.mock('./Element/Skeleton', () => 'skeleton');

const mockGetNPIcons = jest.fn();
const mockSetActiveSubType = jest.fn();

let mockStoreState: any = {};

jest.mock('@core/app/stores/elementPanelStore', () => ({
  useElementPanelStore: (selector: (state: any) => any) => selector(mockStoreState),
}));

import GridContent from './GridContent';

describe('test GridContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render mainType content correctly', () => {
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: false, setActiveSubType: mockSetActiveSubType };

    // sub type label + builtin icons
    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render mainType content correctly when login', () => {
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType };

    // sub type button + builtin icons + np icons
    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();

    const subTypeButton = container.querySelector('.subtitle');

    fireEvent.click(subTypeButton!);
    expect(mockSetActiveSubType).toHaveBeenCalledWith('shape');
  });

  it('should render subType content correctly', () => {
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType };

    // builtin icons + np icons + load more button
    const { container } = render(
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
      />,
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
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType };

    // builtin icons + np icons + load more button
    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();

    const loadMoreButton = container.querySelector('.more');

    fireEvent.click(loadMoreButton!);
    expect(mockGetNPIcons).toHaveBeenCalledWith({
      fileNames: ['basic/icon-star1', 'basic/icon-star2', 'decor/i_circular-1'],
      nextPage: 'next_page_key',
      npIcons: [
        { id: '1', thumbnail_url: 'url_1' },
        { id: '2', thumbnail_url: 'url_2' },
      ],
      term: 'shape',
    });
  });

  it('should render loading correctly', () => {
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType };

    // builtin icons + np icons + 100 skeletons
    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when missing fileNames', () => {
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType };

    // np icons + load more button
    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when missing npIcons', () => {
    mockStoreState = { getNPIcons: mockGetNPIcons, hasLogin: true, setActiveSubType: mockSetActiveSubType };

    // builtin icons
    const { container } = render(
      <GridContent
        content={{
          fileNames: ['icon-star1', 'icon-star2'],
          mainType: 'basic',
          term: 'shape',
        }}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
