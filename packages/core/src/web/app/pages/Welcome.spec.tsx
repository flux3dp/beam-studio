import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/app/components/Chat', () => 'mock-chat');
jest.mock('@core/app/components/beambox/TopBar/tabs/Tabs', () => 'mock-tabs');
jest.mock('@core/app/components/welcome/Banners', () => 'mock-banners');
jest.mock('@core/app/components/welcome/TabFollowUs', () => 'mock-tab-follow-us');
jest.mock('@core/app/components/welcome/TabHelpCenter', () => 'mock-tab-help-center');
jest.mock('@core/app/components/welcome/TabMyCloud', () => 'mock-tab-my-cloud');
jest.mock('@core/app/components/welcome/TabRecentFiles', () => 'mock-tab-recent-files');
jest.mock('@core/app/components/welcome/UserInfo', () => 'mock-user-info');

jest.mock('@core/app/actions/beambox/beambox-global-interaction', () => ({
  attach: jest.fn(),
  detach: jest.fn(),
}));

const mockClearScene = jest.fn();
const mockImportImage = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  clearScene: mockClearScene,
  importImage: mockImportImage,
}));

const mockGetIsWelcomeTab = jest.fn();
const mockAddNewTab = jest.fn();

jest.mock('@core/app/actions/tabController', () => ({
  addNewTab: mockAddNewTab,
  getIsWelcomeTab: mockGetIsWelcomeTab,
  offBlurred: jest.fn(),
  offFocused: jest.fn(),
  onBlurred: jest.fn(),
  onFocused: jest.fn(),
}));

jest.mock('@core/helpers/api/flux-id', () => ({
  axiosFluxId: {
    get: jest.fn(),
  },
  fluxIDEvents: {
    off: jest.fn(),
    on: jest.fn(),
  },
  getCurrentUser: jest.fn(),
}));

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => mockIsWeb);

jest.mock('@core/helpers/locale-helper', () => ({ isNorthAmerica: true, isTw: false }));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  isMac: () => true,
  useIsMobile: mockUseIsMobile,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

import Welcome from './Welcome';

describe('test Welcome', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseIsMobile.mockReturnValue(false);
    mockGetIsWelcomeTab.mockReturnValue(true);
  });

  it('should render correctly', async () => {
    const { container, getByText } = render(<Welcome />);

    expect(container).toMatchSnapshot();
    expect(window.homePage).toBe('#/studio/welcome');

    fireEvent.click(getByText('Open'));
    expect(mockImportImage).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText('New Project'));
    expect(mockClearScene).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText('Beamy'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Design Market'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, 'https://dmkt.io');

    fireEvent.click(getByText('Shop FLUX Products'));
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(mockOpen).toHaveBeenNthCalledWith(2, 'https://shop.flux3dp.com/');
  });

  it('should render correctly in web', () => {
    mockIsWeb.mockReturnValue(true);

    const { container, getByText } = render(<Welcome />);

    expect(container).toMatchSnapshot();
    expect(window.homePage).toBe('#/studio/welcome');

    fireEvent.click(getByText('New Project'));
    expect(mockClearScene).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText('Beamy'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Design Market'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, 'https://dmkt.io');

    fireEvent.click(getByText('Shop FLUX Products'));
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(mockOpen).toHaveBeenNthCalledWith(2, 'https://shop.flux3dp.com/');
  });

  it('should render correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container, getByText } = render(<Welcome />);

    expect(container).toMatchSnapshot();
    expect(window.homePage).toBe('#/studio/welcome');

    fireEvent.click(getByText('Beamy'));
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Design Market'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, 'https://dmkt.io');

    fireEvent.click(getByText('Shop'));
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(mockOpen).toHaveBeenNthCalledWith(2, 'https://shop.flux3dp.com/');
  });

  it('should redirect to editor correctly', () => {
    mockGetIsWelcomeTab.mockReturnValue(false);
    render(<Welcome />);
    expect(window.location.hash).toBe('#/studio/beambox');
  });
});
