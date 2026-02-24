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
  });

  test('should render correctly', async () => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');
    const { baseElement, container, queryByText, unmount } = render(<Workarea className="mac" />);

    expect(baseElement).toMatchSnapshot();

    const checkState = (state: {
      group: boolean;
      menuDisabled: boolean;
      paste: boolean;
      select: boolean;
      ungroup: boolean;
    }) => {
      const workarea = container.querySelector('#workarea');
      const menuDisabled = workarea?.hasAttribute('disabled') ?? false;

      // Open the dropdown to check menu item states
      fireEvent.contextMenu(workarea!);

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
      fireEvent.click(document.body);

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

    // Ensure dropdown is closed before snapshot
    const workareaElement = container.querySelector('#workarea');

    if (workareaElement?.classList.contains('ant-dropdown-open')) {
      act(() => {
        fireEvent.click(document.body);
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(baseElement).toMatchSnapshot();

    // Test layer data
    expect(getSelectedElems).toHaveBeenCalled();
    expect(mockGetObjectLayer).toHaveBeenCalled();
    expect(mockGetAllLayerNames).toHaveBeenCalled();

    unmount();
    expect(eventEmitter.eventNames().length).toBe(0);
  });
});
