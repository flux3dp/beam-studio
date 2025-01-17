/* eslint-disable import/first */
import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('app/svgedit/operations/clipboard', () => ({
  pasteElements: jest.fn(),
}));

jest.mock('app/actions/beambox/svg-editor', () => ({
  cutSelected: jest.fn(),
  copySelected: jest.fn(),
  deleteSelected: jest.fn(),
}));

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
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
      groupSelectedElements,
      ungroupSelectedElement,
      moveTopBottomSelected,
      moveUpSelectedElement,
      moveDownSelectedElement,
      getSelectedElems,
      getCurrentDrawing: () => ({
        all_layers: [{ name_: 'Layer 1' }, { name_: 'Layer 2' }],
      }),
    },
  });
});

jest.mock('helpers/react-contextmenu', () => ({
  ContextMenu: 'dummy-context-menu',
  ContextMenuTrigger: 'dummy-context-menu-trigger',
  MenuItem: 'dummy-menu-item',
  SubMenu: 'dummy-sub-menu',
}));

const mockgetObjectLayer = jest.fn().mockReturnValue({ title: 'Layer 1' });
const mockMoveToOtherLayer = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  moveToOtherLayer: (...args: any[]) => mockMoveToOtherLayer(...args),
  getObjectLayer: (...args: any[]) => mockgetObjectLayer(...args),
}));

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import Workarea from './Workarea';

describe('test workarea', () => {
  test('should render correctly', async () => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');
    const { container, getByText, unmount } = render(<Workarea className="mac" />);
    expect(container).toMatchSnapshot();

    const checkState = (state: {
      menuDisabled: boolean;
      select: boolean;
      paste: boolean;
      group: boolean;
      ungroup: boolean;
    }) => {
      const menuDisabled =
        container.querySelector('#canvas-contextmenu').getAttribute('disable') === 'true';
      const select = getByText('Cut').getAttribute('disabled') === 'false';
      const paste = getByText('Paste').getAttribute('disabled') === 'false';
      const group = select
        ? getByText('Group').getAttribute('disabled') === 'false'
        : expect.anything();
      const ungroup = select
        ? getByText('Ungroup').getAttribute('disabled') === 'false'
        : expect.anything();
      expect(state).toEqual({ menuDisabled, select, paste, group, ungroup });
    };

    checkState({
      menuDisabled: false,
      select: false,
      paste: false,
      group: false,
      ungroup: false,
    });
    expect(eventEmitter.eventNames().length).toBe(1);

    act(() => eventEmitter.emit('update-context-menu', { select: true, paste: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    checkState({
      menuDisabled: false,
      select: true,
      paste: true,
      group: false,
      ungroup: false,
    });

    act(() => eventEmitter.emit('update-context-menu', { menuDisabled: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    checkState({
      menuDisabled: true,
      select: true,
      paste: true,
      group: false,
      ungroup: false,
    });
    expect(container).toMatchSnapshot();

    expect(getSelectedElems).toBeCalled();
    expect(mockgetObjectLayer).toBeCalled();
    expect(getByText('Layer 1')).toBeDisabled();
    expect(mockMoveToOtherLayer).not.toBeCalled();
    fireEvent.click(getByText('Layer 2'));
    expect(mockMoveToOtherLayer).toHaveBeenCalledTimes(1);
    expect(mockMoveToOtherLayer).toHaveBeenLastCalledWith('Layer 2', expect.anything(), false);

    unmount();
    expect(eventEmitter.eventNames().length).toBe(0);
  });
});
