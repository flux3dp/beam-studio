import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

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

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      cloneSelectedElements,
      groupSelectedElements,
      moveDownSelectedElement,
      moveTopBottomSelected,
      moveUpSelectedElement,
      ungroupSelectedElement,
    },
  });
});

const getSelectedElements = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  getSelectedElements,
  isTempGroup: () => false,
}));

const mockGetObjectLayer = jest.fn().mockReturnValue({ title: 'Layer 1' });
const mockMoveToOtherLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (...args: any[]) => mockGetObjectLayer(...args),
  moveToOtherLayer: (...args: any[]) => mockMoveToOtherLayer(...args),
}));

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import Workarea from './Workarea';

describe('test workarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllLayerNames.mockReturnValue(['Layer 1', 'Layer 2']);
    getSelectedElements.mockReturnValue([{}]);
  });

  test('should render correctly', async () => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');
    const { baseElement, container, queryByText, unmount } = render(<Workarea className="mac" />);

    expect(baseElement).toMatchSnapshot();

    const checkState = async (state: {
      group: boolean;
      menuDisabled: boolean;
      paste: boolean;
      select: boolean;
      ungroup: boolean;
    }) => {
      const workarea = container.querySelector('#workarea')!;
      const menuDisabled = workarea.hasAttribute('disabled');

      // Open the dropdown to check menu item states
      await act(() => fireEvent.contextMenu(workarea));

      const cutItem = queryByText('Cut')?.closest('.ant-dropdown-menu-item');
      const pasteItem = queryByText('Paste')?.closest('.ant-dropdown-menu-item');
      const groupItem = queryByText('Group')?.closest('.ant-dropdown-menu-item');
      const ungroupItem = queryByText('Ungroup')?.closest('.ant-dropdown-menu-item');

      const select = cutItem ? !cutItem.classList.contains('ant-dropdown-menu-item-disabled') : false;
      const paste = pasteItem ? !pasteItem.classList.contains('ant-dropdown-menu-item-disabled') : false;
      const group = groupItem && select ? !groupItem.classList.contains('ant-dropdown-menu-item-disabled') : false;
      const ungroup =
        ungroupItem && select ? !ungroupItem.classList.contains('ant-dropdown-menu-item-disabled') : false;

      // Close the dropdown by clicking elsewhere
      await act(() => fireEvent.click(workarea));

      expect(state).toEqual({ group, menuDisabled, paste, select, ungroup });
    };

    await checkState({
      group: false,
      menuDisabled: false,
      paste: false,
      select: false,
      ungroup: false,
    });
    expect(eventEmitter.eventNames().length).toBe(1);

    act(() => eventEmitter.emit('update-context-menu', { paste: true, select: true }));
    await checkState({
      group: false,
      menuDisabled: false,
      paste: true,
      select: true,
      ungroup: false,
    });

    act(() => eventEmitter.emit('update-context-menu', { menuDisabled: true }));
    await checkState({
      group: false,
      menuDisabled: true,
      paste: true,
      select: true,
      ungroup: false,
    });

    expect(baseElement).toMatchSnapshot();

    // Test layer data
    expect(getSelectedElements).toHaveBeenCalled();
    expect(mockGetObjectLayer).toHaveBeenCalled();
    expect(mockGetAllLayerNames).toHaveBeenCalled();

    unmount();
    expect(eventEmitter.eventNames().length).toBe(0);
  });
});
