import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import Tabs from './Tabs';

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({}),
}));

const mockCloseTab = jest.fn();
const mockFocusTab = jest.fn();
const mockGetAllTabs = jest.fn();
const mockGetCurrentId = jest.fn();
const mockMoveTab = jest.fn();
const mockOnFocused = jest.fn();
const mockOnTabsUpdated = jest.fn();
const mockOffFocused = jest.fn();
const mockOffTabsUpdated = jest.fn();

jest.mock('@core/app/actions/tabController', () => ({
  closeTab: (...args) => mockCloseTab(...args),
  focusTab: (...args) => mockFocusTab(...args),
  getAllTabs: (...args) => mockGetAllTabs(...args),
  getCurrentId: (...args) => mockGetCurrentId(...args),
  moveTab: (...args) => mockMoveTab(...args),
  offFocused: (...args) => mockOffFocused(...args),
  offTabsUpdated: (...args) => mockOffTabsUpdated(...args),
  onFocused: (...args) => mockOnFocused(...args),
  onTabsUpdated: (...args) => mockOnTabsUpdated(...args),
}));

const mockOnTitleChange = jest.fn();
const mockOffTitleChange = jest.fn();

jest.mock('@core/app/views/beambox/TopBar/contexts/TopBarController', () => ({
  offTitleChange: (...args) => mockOffTitleChange(...args),
  onTitleChange: (...args) => mockOnTitleChange(...args),
}));

const mockRenameFile = jest.fn();

jest.mock('@core/helpers/api/cloudFile', () => ({
  renameFile: (...args) => mockRenameFile(...args),
}));

const mockGetName = jest.fn();
const mockGetPath = jest.fn();
const mockSetCloudUUID = jest.fn();
const mockSetFileName = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  getName: (...args) => mockGetName(...args),
  getPath: (...args) => mockGetPath(...args),
  setCloudUUID: (...args) => mockSetCloudUUID(...args),
  setFileName: (...args) => mockSetFileName(...args),
}));

const mockGetPromptValue = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  getPromptValue: (...args) => mockGetPromptValue(...args),
}));

const mockTabs = [
  {
    id: 1,
    isCloud: false,
    isLoading: false,
    mode: CanvasMode.Draw,
    title: 'Untitled',
  },
  {
    id: 2,
    isCloud: false,
    isLoading: false,
    mode: CanvasMode.Preview,
    title: 'preview',
  },
  {
    id: 3,
    isCloud: false,
    isLoading: true,
    mode: CanvasMode.Preview,
    title: 'Loading',
  },
  {
    id: 4,
    isCloud: true,
    isLoading: false,
    mode: CanvasMode.Draw,
    title: 'Cloud File',
  },
  {
    id: 5,
    isCloud: false,
    isLoading: false,
    mode: CanvasMode.CurveEngraving,
    title: 'Curve Engraving',
  },
];

describe('test Tabs', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    mockGetAllTabs.mockReturnValue(mockTabs);
    mockGetCurrentId.mockReturnValue(1);

    const { container } = render(<Tabs />);

    expect(container).toMatchSnapshot();
  });

  test('focus and close tab should work correctly', () => {
    mockGetAllTabs.mockReturnValue(mockTabs);
    mockGetCurrentId.mockReturnValue(1);

    const { container } = render(<Tabs />);
    const tab2 = container.querySelectorAll('.tab')[1];

    expect(mockFocusTab).not.toBeCalled();
    fireEvent.click(tab2);
    expect(mockFocusTab).toBeCalledTimes(1);

    const closeBtn = tab2.querySelector('.close');

    expect(mockCloseTab).not.toBeCalled();
    fireEvent.click(closeBtn);
    expect(mockCloseTab).toBeCalledTimes(1);
  });

  test('tab controller events should be registered and unregistered correctly', () => {
    mockGetAllTabs.mockReturnValue(mockTabs);
    mockGetCurrentId.mockReturnValue(1);

    const { container, unmount } = render(<Tabs />);

    expect(mockOnFocused).toBeCalledTimes(1);
    expect(mockOnTabsUpdated).toBeCalledTimes(1);
    mockGetAllTabs.mockReturnValue([
      { id: 1, isCloud: false, isLoading: false, mode: CanvasMode.Draw, title: 'new tab1' },
      { id: 2, isCloud: false, isLoading: false, mode: CanvasMode.Draw, title: 'new tab2' },
    ]);
    act(() => mockOnTabsUpdated.mock.calls[0][0]());
    expect(container).toMatchSnapshot();
    unmount();
    expect(mockOffFocused).toBeCalledTimes(1);
    expect(mockOffTabsUpdated).toBeCalledTimes(1);
  });

  test('current tab title should be updated correctly', () => {
    mockGetAllTabs.mockReturnValue([
      { id: 1, isCloud: false, isLoading: false, mode: CanvasMode.Draw, title: 'untitled' },
    ]);
    mockGetCurrentId.mockReturnValue(1);

    const { container, rerender } = render(
      <CanvasContext.Provider value={{ hasUnsavedChange: false } as any}>
        <Tabs />
      </CanvasContext.Provider>,
    );

    expect(mockOnTitleChange).toBeCalledTimes(1);
    act(() => mockOnTitleChange.mock.calls[0][0]('new title', false));
    expect(container.querySelector('.name').textContent).toBe('new title');
    rerender(
      <CanvasContext.Provider value={{ hasUnsavedChange: true } as any}>
        <Tabs />
      </CanvasContext.Provider>,
    );
    expect(container.querySelector('.name').textContent).toBe('new title*');
  });

  test('rename local tab', async () => {
    mockGetAllTabs.mockReturnValue(mockTabs);
    mockGetCurrentId.mockReturnValue(1);

    const { container } = render(<Tabs />);
    const tab1 = container.querySelectorAll('.tab')[0];

    mockGetName.mockReturnValue('Untitled');
    mockGetPromptValue.mockReturnValue('new name');
    await act(() => fireEvent.dblClick(tab1));
    expect(mockGetPromptValue).toBeCalledTimes(1);
    expect(mockSetFileName).toBeCalledTimes(1);
    expect(mockSetFileName).toBeCalledWith('new name', { clearPath: true });
  });

  test('rename cloud tab', async () => {
    mockGetAllTabs.mockReturnValue(mockTabs);
    mockGetCurrentId.mockReturnValue(1);

    const { container } = render(<Tabs />);

    expect(mockOnTitleChange).toBeCalledTimes(1);
    act(() => mockOnTitleChange.mock.calls[0][0]('title', true));

    const tab1 = container.querySelectorAll('.tab')[0];

    mockGetName.mockReturnValue('title');
    mockGetPath.mockReturnValue('cloud-path');
    mockGetPromptValue.mockReturnValue('new name');
    mockRenameFile.mockResolvedValue({ res: true });
    await act(() => fireEvent.dblClick(tab1));
    expect(mockGetPromptValue).toBeCalledTimes(1);
    expect(mockRenameFile).toBeCalledTimes(1);
    expect(mockRenameFile).toBeCalledWith('cloud-path', 'new name');
  });
});
