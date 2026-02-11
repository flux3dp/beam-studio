import React, { act } from 'react';

import { render } from '@testing-library/react';

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
    const { container, unmount } = render(<Workarea className="mac" />);

    expect(container).toMatchSnapshot();

    expect(eventEmitter.eventNames().length).toBe(1);

    act(() => eventEmitter.emit('update-context-menu', { paste: true, select: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    act(() => eventEmitter.emit('update-context-menu', { menuDisabled: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toMatchSnapshot();

    unmount();
    expect(eventEmitter.eventNames().length).toBe(0);
  });
});
