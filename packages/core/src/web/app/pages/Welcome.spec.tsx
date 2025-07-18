import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

jest.mock('@core/app/components/beambox/svg-editor/Chat', () => 'mock-chat');
jest.mock('@core/app/components/beambox/top-bar/tabs/Tabs', () => 'mock-tabs');
jest.mock('@core/app/components/welcome/Banners', () => 'mock-banners');
jest.mock('@core/app/components/welcome/TabFollowUs', () => 'mock-tab-follow-us');
jest.mock('@core/app/components/welcome/TabHelpCenter', () => 'mock-tab-help-center');
jest.mock('@core/app/components/welcome/TabMyCloud', () => 'mock-tab-my-cloud');
jest.mock('@core/app/components/welcome/TabRecentFiles', () => 'mock-tab-recent-files');
jest.mock('@core/app/components/welcome/UserInfo', () => 'mock-user-info');

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

const mockCheckTabCount = jest.fn();
const mockSetFileInAnotherTab = jest.fn();

jest.mock('@core/helpers/fileImportHelper', () => ({
  checkTabCount: mockCheckTabCount,
  setFileInAnotherTab: mockSetFileInAnotherTab,
}));

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => mockIsWeb);

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  isMac: () => true,
  useIsMobile: mockUseIsMobile,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

const mockGetFileFromDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  getFileFromDialog: mockGetFileFromDialog,
}));

import Welcome from './Welcome';

describe('test Welcome', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseIsMobile.mockReturnValue(false);
    mockCheckTabCount.mockReturnValue(true);
    mockGetIsWelcomeTab.mockReturnValue(true);
  });

  it('should render correctly', async () => {
    const mockFile = { key: 'mock-file' };

    mockGetFileFromDialog.mockResolvedValue(mockFile);

    const { container, getByText } = render(<Welcome />);

    expect(container).toMatchSnapshot();
    expect(window.homePage).toBe('#/studio/welcome');

    await act(() => fireEvent.click(getByText('Open')));
    expect(mockCheckTabCount).toHaveBeenCalledTimes(1);
    expect(mockGetFileFromDialog).toHaveBeenCalledTimes(1);
    expect(mockSetFileInAnotherTab).toHaveBeenCalledTimes(1);
    expect(mockSetFileInAnotherTab).toHaveBeenNthCalledWith(1, { data: mockFile, type: 'normal' });

    fireEvent.click(getByText('New Project'));
    expect(mockCheckTabCount).toHaveBeenCalledTimes(2);
    expect(mockAddNewTab).toHaveBeenCalledTimes(1);

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
    expect(mockCheckTabCount).not.toHaveBeenCalled();
    expect(mockAddNewTab).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/studio/beambox');

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
