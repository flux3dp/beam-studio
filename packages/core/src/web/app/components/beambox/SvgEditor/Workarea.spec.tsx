import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/app/svgedit/operations/clipboard', () => ({
  pasteElements: jest.fn(),
}));

jest.mock('@core/app/actions/beambox/svg-editor', () => ({
  copySelected: jest.fn(),
  cutSelected: jest.fn(),
  deleteSelected: jest.fn(),
}));

const mockGetAllLayerNames = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayerNames: mockGetAllLayerNames,
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const cloneSelectedElements = jest.fn();
const groupSelectedElements = jest.fn();
const ungroupSelectedElement = jest.fn();
const moveTopBottomSelected = jest.fn();
const moveUpSelectedElement = jest.fn();
const moveDownSelectedElement = jest.fn();
const getSelectedElems = jest.fn().mockReturnValue([{ getAttribute: () => 'false' }]);

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      cloneSelectedElements,
      getSelectedElems,
      groupSelectedElements,
      moveDownSelectedElement,
      moveTopBottomSelected,
      moveUpSelectedElement,
      ungroupSelectedElement,
    },
  });
});

jest.mock('@core/helpers/react-contextmenu', () => ({
  ContextMenu: 'dummy-context-menu',
  ContextMenuTrigger: 'dummy-context-menu-trigger',
  MenuItem: 'dummy-menu-item',
  SubMenu: 'dummy-sub-menu',
}));

const mockgetObjectLayer = jest.fn().mockReturnValue({ title: 'Layer 1' });
const mockMoveToOtherLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (...args: any[]) => mockgetObjectLayer(...args),
  moveToOtherLayer: (...args: any[]) => mockMoveToOtherLayer(...args),
}));

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import Workarea from './Workarea';

describe('test workarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllLayerNames.mockReturnValue(['Layer 1', 'Layer 2']);
  });

  test('should render correctly', async () => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');
    const { container, getByText, unmount } = render(<Workarea className="mac" />);

    expect(container).toMatchSnapshot();

    const checkState = (state: {
      group: boolean;
      menuDisabled: boolean;
      paste: boolean;
      select: boolean;
      ungroup: boolean;
    }) => {
      const menuDisabled = container.querySelector('#canvas-contextmenu').getAttribute('disable') === 'true';
      const select = getByText('Cut').getAttribute('disabled') === 'false';
      const paste = getByText('Paste').getAttribute('disabled') === 'false';
      const group = select ? getByText('Group').getAttribute('disabled') === 'false' : expect.anything();
      const ungroup = select ? getByText('Ungroup').getAttribute('disabled') === 'false' : expect.anything();

      expect(state).toEqual({ group, menuDisabled, paste, select, ungroup });
    };

    checkState({
      group: false,
      menuDisabled: false,
      paste: false,
      select: false,
      ungroup: false,
    });
    expect(eventEmitter.eventNames().length).toBe(1);

    act(() => eventEmitter.emit('update-context-menu', { paste: true, select: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    checkState({
      group: false,
      menuDisabled: false,
      paste: true,
      select: true,
      ungroup: false,
    });

    act(() => eventEmitter.emit('update-context-menu', { menuDisabled: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    checkState({
      group: false,
      menuDisabled: true,
      paste: true,
      select: true,
      ungroup: false,
    });
    expect(container).toMatchSnapshot();

    expect(getSelectedElems).toHaveBeenCalled();
    expect(mockgetObjectLayer).toHaveBeenCalled();
    expect(getByText('Layer 1')).toBeDisabled();
    expect(mockMoveToOtherLayer).not.toHaveBeenCalled();
    fireEvent.click(getByText('Layer 2'));
    expect(mockMoveToOtherLayer).toHaveBeenCalledTimes(1);
    expect(mockMoveToOtherLayer).toHaveBeenLastCalledWith('Layer 2', expect.anything(), false);

    unmount();
    expect(eventEmitter.eventNames().length).toBe(0);
  });
});
